import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type CmsType = "quote" | "prediction" | "vinyl";
type CmsWorkspace = "content" | "media" | "maps" | "account";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function Admin() {
  const [username, setUsername] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("braz-cms-username") ?? "" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const session = trpc.admin.session.useQuery(undefined, { retry: false });
  const login = trpc.admin.login.useMutation();
  const logout = trpc.admin.logout.useMutation();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const result = await login.mutateAsync({ username, password });
      if (!result.ok) {
        setError("Verkeerd wachtwoord.");
        return;
      }
      window.localStorage.setItem("braz-cms-username", username);
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
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            autoComplete="username"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Wachtwoord"
            autoComplete="current-password"
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
  const [workspace, setWorkspace] = useState<CmsWorkspace>("content");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const changePassword = trpc.admin.changePassword.useMutation();

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
        <div className="cms-dashboard-head">
          <div>
            <p className="admin-eyebrow">// BRAZ MONKEY CMS / CONTROL CENTER</p>
            <h1>RUN THE <em>SIGNAL.</em></h1>
            <p className="cms-dashboard-lede">Choose a workspace. Publish weekly content, sync footage folders, or manage the live navigation map.</p>
          </div>
          <button type="button" className="ghost" onClick={onLogout}>UITLOGGEN</button>
        </div>
        <nav className="cms-workspace-nav" aria-label="CMS workspaces">
          <button type="button" className={workspace === "content" ? "active" : ""} onClick={() => setWorkspace("content")}><b>01</b><span>CONTENT DESK</span><small>Quotes, predictions, vinyl</small></button>
          <button type="button" className={workspace === "media" ? "active" : ""} onClick={() => setWorkspace("media")}><b>02</b><span>MEDIA FOLDERS</span><small>Monday, Wednesday, Friday</small></button>
          <button type="button" className={workspace === "maps" ? "active" : ""} onClick={() => setWorkspace("maps")}><b>03</b><span>PAGE MAPS</span><small>Navigation and submaps</small></button>
          <button type="button" className={workspace === "account" ? "active" : ""} onClick={() => setWorkspace("account")}><b>04</b><span>ACCOUNT</span><small>Change CMS password</small></button>
        </nav>

        {workspace === "content" && <section className="cms-workspace-panel">
        <div className="cms-section-heading"><div><p className="admin-eyebrow">// CONTENT DESK</p><h2>WEEKLY POSTS</h2></div><span className="admin-badge admin-badge-quote">LIVE SYNC</span></div>
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
        </section>}

        {workspace === "media" && <TransmissionMediaManager />}
        {workspace === "maps" && <NavigationManager />}
        {workspace === "account" && <section className="cms-workspace-panel">
          <div className="cms-section-heading"><div><p className="admin-eyebrow">// ACCOUNT SECURITY</p><h2>CHANGE PASSWORD</h2></div><span className="admin-badge admin-badge-vinyl">PRIVATE</span></div>
          <p className="cms-dashboard-lede cms-account-copy">Update the CMS password without editing code or environment settings. Your username stays the same.</p>
          <form className="admin-form cms-password-form" onSubmit={async (event) => {
            event.preventDefault();
            setPasswordStatus("");
            if (newPassword !== confirmPassword) {
              setPasswordStatus("New passwords do not match.");
              return;
            }
            try {
              await changePassword.mutateAsync({ currentPassword, newPassword });
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setPasswordStatus("Password changed. Use the new password next time you log in.");
            } catch (passwordError) {
              setPasswordStatus(errorMessage(passwordError, "Password change failed."));
            }
          }}>
            <label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
            <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} autoComplete="new-password" required /></label>
            <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} autoComplete="new-password" required /></label>
            <button type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? "UPDATING..." : "CHANGE PASSWORD"}</button>
            {passwordStatus && <p className="admin-status" role="status">{passwordStatus}</p>}
          </form>
        </section>}
      </div>
    </main>
  );
}

function NavigationManager() {
  const [section, setSection] = useState("signal");
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("/");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const list = trpc.navigation.list.useQuery(undefined, { refetchInterval: 15000 });
  const save = trpc.navigation.save.useMutation();
  const update = trpc.navigation.update.useMutation();
  const remove = trpc.navigation.delete.useMutation();

  const reset = () => {
    setEditingId(null);
    setSection("signal");
    setLabel("");
    setPath("/");
    setSortOrder(0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Navigatie opslaan...");
    try {
      if (editingId === null) {
        await save.mutateAsync({ section, label, path, sortOrder });
      } else {
        await update.mutateAsync({ id: editingId, section, label, path, sortOrder });
      }
      await list.refetch();
      reset();
      setStatus("Navigatie opgeslagen. De live submaps zijn bijgewerkt.");
    } catch (error) {
      setStatus(`Navigatie mislukt: ${errorMessage(error, "onbekende fout")}`);
    }
  };

  return <section className="admin-navigation-manager">
    <div className="admin-list-heading"><div><p className="admin-eyebrow">// PAGE MAPS</p><h2>SUBMAP NAVIGATIE</h2></div><span className="admin-badge admin-badge-vinyl">CMS LIVE</span></div>
    <form className="admin-form admin-navigation-form" onSubmit={submit}>
      <label>Hoofdsectie<select value={section} onChange={(event) => setSection(event.target.value)}>{["signal", "transmissions", "telemetry", "origin", "archive", "follow", "blackbook"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>Submap label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Bijv. Weekly drops" required /></label>
      <label>Pagina route<input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/transmissions" required /></label>
      <label>Volgorde<input type="number" min={0} max={999} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} /></label>
      <div className="admin-item-actions"><button type="submit" disabled={save.isPending || update.isPending}>{editingId === null ? "SUBMAP TOEVOEGEN" : "SUBMAP OPSLAAN"}</button>{editingId !== null && <button type="button" className="ghost" onClick={reset}>ANNULEREN</button>}</div>
      {status && <p className="admin-status">{status}</p>}
    </form>
    <div className="admin-navigation-list">{(list.data ?? []).map((item) => <div className="admin-navigation-row" key={item.id}>
      <div><span className="admin-badge admin-badge-quote">{item.section.toUpperCase()}</span><strong>{item.label}</strong><small>{item.path} · #{item.sortOrder}</small></div>
      <div className="admin-item-actions"><button type="button" onClick={() => { setEditingId(item.id); setSection(item.section); setLabel(item.label); setPath(item.path); setSortOrder(item.sortOrder); }}>BEWERK</button><button type="button" className="danger" onClick={async () => { if (!window.confirm(`Verwijder submap: ${item.section} — ${item.label}?`)) return; await remove.mutateAsync({ id: item.id }); await list.refetch(); }}>VERWIJDER</button></div>
    </div>)}</div>
  </section>;
}


function TransmissionMediaManager() {
  const [slot, setSlot] = useState<"monday" | "wednesday" | "friday">("monday");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const list = trpc.transmissionMedia.list.useQuery(undefined, { refetchInterval: 15000 });
  const save = trpc.transmissionMedia.save.useMutation();
  const remove = trpc.transmissionMedia.delete.useMutation();

  const toBase64 = (input: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(input);
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setStatus("Kies eerst een beeld of video.");
    setStatus("Footage uploaden en synchroniseren...");
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      await save.mutateAsync({ slot, mediaType, title: title || undefined, caption: caption || undefined, fileName: file.name, fileData: await toBase64(file), mimeType: file.type });
      await list.refetch();
      setTitle(""); setCaption(""); setFile(null); if (fileRef.current) fileRef.current.value = "";
      setStatus("Opgeslagen. De nieuwste media staat nu live in de juiste weekkaart.");
    } catch (error) {
      setStatus(`Upload mislukt: ${errorMessage(error, "onbekende fout")}`);
    }
  };

  const slotLabel = (value: string) => value === "monday" ? "MONDAY / MORNING QUOTES" : value === "wednesday" ? "WEDNESDAY / PREDICTIONS" : "FRIDAY / VINYL DROP";

  return <section className="admin-media-manager">
    <div className="admin-list-heading"><div><p className="admin-eyebrow">// WEEKLY MEDIA MAPS</p><h2>SYNCED TRANSMISSIONS</h2></div><span className="admin-badge admin-badge-vinyl">AUTO-LIVE</span></div>
    <p className="admin-media-help">Drop an image or footage into a weekly map. The newest upload automatically replaces the visual on that transmission card; older uploads stay in the archive list below.</p>
    <form className="admin-form admin-media-form" onSubmit={submit}>
      <label>Map<select value={slot} onChange={(event) => setSlot(event.target.value as typeof slot)}><option value="monday">MONDAY / MORNING QUOTES</option><option value="wednesday">WEDNESDAY / PREDICTIONS</option><option value="friday">FRIDAY / VINYL DROP</option></select></label>
      <label>Title (optional)<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Transmission title" /></label>
      <label>Caption (optional)<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} placeholder="Short note for the live card" /></label>
      <label>Image or footage<input ref={fileRef} type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
      <button type="submit" disabled={save.isPending}>{save.isPending ? "SYNCING..." : "UPLOAD & SYNC MAP"}</button>
      {status && <p className="admin-status">{status}</p>}
    </form>
    <div className="admin-media-list">{(list.data ?? []).map((item) => <div className="admin-media-row" key={item.id}><div><span className="admin-badge admin-badge-quote">{slotLabel(item.slot)}</span><strong>{item.title || item.fileName}</strong><small>{item.mediaType.toUpperCase()} · {new Date(item.createdAt).toLocaleString()}</small></div><button type="button" className="danger" onClick={async () => { if (!window.confirm(`Verwijder ${item.fileName} uit ${slotLabel(item.slot)}?`)) return; await remove.mutateAsync({ id: item.id }); await list.refetch(); }}>VERWIJDER</button></div>)}</div>
  </section>;
}
