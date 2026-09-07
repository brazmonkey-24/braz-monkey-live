import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type CmsType = "quote" | "prediction" | "vinyl";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const session = trpc.admin.session.useQuery(undefined, { retry: false });
  const login = trpc.admin.login.useMutation();
  const logout = trpc.admin.logout.useMutation();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const result = await login.mutateAsync({ password });
      if (!result.ok) {
        setError("Verkeerd wachtwoord.");
        return;
      }
      setPassword("");
      await session.refetch();
    } catch (loginError) {
      setError(errorMessage(loginError, "Er ging iets mis. Probeer opnieuw."));
    }
  };

  if (session.isLoading) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <p className="admin-eyebrow">// BRAZ MONKEY CMS</p>
          <h1>ADMIN SESSIE CONTROLEREN...</h1>
        </div>
      </main>
    );
  }

  if (!session.data?.ok) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={handleLogin}>
          <p className="admin-eyebrow">// BRAZ MONKEY CMS</p>
          <h1>ADMIN LOGIN</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Wachtwoord"
            autoFocus
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" disabled={login.isPending}>
            {login.isPending ? "BEZIG..." : "INLOGGEN"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <AdminDashboard
      onLogout={async () => {
        await logout.mutateAsync();
        await session.refetch();
      }}
    />
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [type, setType] = useState<CmsType>("quote");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const save = trpc.content.save.useMutation();
  const list = trpc.content.list.useQuery(undefined, { refetchInterval: 15000 });
  const updateMut = trpc.content.update.useMutation();
  const deleteMut = trpc.content.delete.useMutation();
  const utils = trpc.useUtils();

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Opslaan...");

    try {
      const imageData = imageFile ? await toBase64(imageFile) : undefined;
      await save.mutateAsync({
        type,
        body,
        title: type === "vinyl" ? title : undefined,
        artist: type === "vinyl" ? artist : undefined,
        imageFileName: imageFile?.name,
        imageData,
        imageMime: imageFile?.type,
      });
      await Promise.all([list.refetch(), utils.content.latest.invalidate()]);
      setBody("");
      setTitle("");
      setArtist("");
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setStatus("Opgeslagen! CMS en live-signaal zijn bijgewerkt.");
    } catch (saveError) {
      setStatus(`Opslaan mislukt: ${errorMessage(saveError, "onbekende fout")}`);
    }
  };

  const handleUpdate = async (itemId: number) => {
    setStatus("Wijziging opslaan...");
    try {
      await updateMut.mutateAsync({
        id: itemId,
        body: editBody,
        title: editTitle,
        artist: editArtist,
      });
      await Promise.all([list.refetch(), utils.content.latest.invalidate()]);
      setEditingId(null);
      setStatus("Wijziging opgeslagen en gesynchroniseerd.");
    } catch (updateError) {
      setStatus(`Wijzigen mislukt: ${errorMessage(updateError, "onbekende fout")}`);
    }
  };

  const handleDelete = async (item: NonNullable<typeof list.data>[number]) => {
    const identifier = item.title || item.body.slice(0, 80);
    if (!window.confirm(`Verwijder definitief: ${item.type.toUpperCase()} — ${identifier}?`)) return;

    setStatus("Verwijderen...");
    try {
      await deleteMut.mutateAsync({ id: item.id });
      await Promise.all([list.refetch(), utils.content.latest.invalidate()]);
      setStatus("Post verwijderd en live-signaal bijgewerkt.");
    } catch (deleteError) {
      setStatus(`Verwijderen mislukt: ${errorMessage(deleteError, "onbekende fout")}`);
    }
  };

  return (
    <main className="admin-shell">
      <div className="admin-panel">
        <p className="admin-eyebrow">// CMS DASHBOARD</p>
        <div className="admin-item-actions">
          <h1>NIEUWE CONTENT</h1>
          <button type="button" className="ghost" onClick={onLogout}>
            UITLOGGEN
          </button>
        </div>

        <form onSubmit={handleSave} className="admin-form">
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value as CmsType)}>
              <option value="quote">Quote (Maandag)</option>
              <option value="prediction">Voorspelling (Woensdag)</option>
              <option value="vinyl">Vinyl (Vrijdag)</option>
            </select>
          </label>

          {type === "vinyl" && (
            <>
              <label>
                Titel
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Plaat-titel" required />
              </label>
              <label>
                Artiest
                <input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="Artiest" required />
              </label>
            </>
          )}

          <label>
            {type === "quote" ? "Quote" : type === "prediction" ? "Voorspelling" : "Verhaal"}
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} required placeholder="Schrijf hier..." />
          </label>

          <label>
            Afbeelding (optioneel)
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button type="submit" disabled={save.isPending}>
            {save.isPending ? "OPSLAAN..." : "OPSLAAN"}
          </button>
          {status && <p className="admin-status">{status}</p>}
        </form>

        <div className="admin-list">
          <p className="admin-eyebrow">// BEHEER</p>
          <h2>EERDERE POSTS</h2>
          {(list.data ?? []).length === 0 && <p className="admin-empty">Nog geen posts.</p>}
          {(list.data ?? []).map((item) => (
            <div key={item.id} className="admin-item">
              {editingId === item.id ? (
                <div className="admin-edit">
                  {item.type === "vinyl" && (
                    <>
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Titel" />
                      <input value={editArtist} onChange={(event) => setEditArtist(event.target.value)} placeholder="Artiest" />
                    </>
                  )}
                  <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} rows={4} />
                  <div className="admin-item-actions">
                    <button type="button" onClick={() => handleUpdate(item.id)} disabled={updateMut.isPending}>
                      OPSLAAN
                    </button>
                    <button type="button" className="ghost" onClick={() => setEditingId(null)}>
                      ANNULEREN
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-item-meta">
                    <span className={`admin-badge admin-badge-${item.type}`}>{item.type.toUpperCase()}</span>
                    {item.title && <strong>{item.title}{item.artist ? ` — ${item.artist}` : ""}</strong>}
                    <p>{item.body.slice(0, 120)}{item.body.length > 120 ? "…" : ""}</p>
                  </div>
                  <div className="admin-item-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditBody(item.body);
                        setEditTitle(item.title ?? "");
                        setEditArtist(item.artist ?? "");
                      }}
                    >
                      BEWERK
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(item)} disabled={deleteMut.isPending}>
                      VERWIJDER
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
