import { useState } from "react";
import { trpc } from "@/lib/trpc";

type CmsType = "quote" | "prediction" | "vinyl";

const SESSION_KEY = "braz_admin_auth";

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { password },
      {
        onSuccess: (res) => {
          if (res.ok) {
            sessionStorage.setItem(SESSION_KEY, "1");
            setAuthed(true);
          } else {
            setError("Verkeerd wachtwoord.");
          }
        },
        onError: () => setError("Er ging iets mis. Probeer opnieuw."),
      }
    );
  };

  if (!authed) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={handleLogin}>
          <p className="admin-eyebrow">// BRAZ MONKEY CMS</p>
          <h1>ADMIN LOGIN</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            autoFocus
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" disabled={login.isPending}>
            {login.isPending ? "BEzig..." : "INLOGGEN"}
          </button>
        </form>
      </main>
    );
  }

  return <AdminDashboard password={password} />;
}

function AdminDashboard({ password }: { password: string }) {
  const [type, setType] = useState<CmsType>("quote");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const save = trpc.content.save.useMutation();

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Opslaan...");
    try {
      let imageData: string | undefined;
      if (imageFile) imageData = await toBase64(imageFile);
      await save.mutateAsync({
        password,
        type,
        body,
        title: type === "vinyl" ? title : undefined,
        artist: type === "vinyl" ? artist : undefined,
        imageFileName: imageFile?.name,
        imageData,
        imageMime: imageFile?.type,
      });
      setStatus("Opgeslagen! De live site is direct bijgewerkt.");
      setBody("");
      setTitle("");
      setArtist("");
      setImageFile(null);
    } catch {
      setStatus("Opslaan mislukt. Probeer opnieuw.");
    }
  };

  return (
    <main className="admin-shell">
      <div className="admin-panel">
        <p className="admin-eyebrow">// CMS DASHBOARD</p>
        <h1>NIEUWE CONTENT</h1>
        <form onSubmit={handleSave} className="admin-form">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as CmsType)}>
              <option value="quote">Quote (Maandag)</option>
              <option value="prediction">Voorspelling (Woensdag)</option>
              <option value="vinyl">Vinyl (Vrijdag)</option>
            </select>
          </label>

          {type === "vinyl" && (
            <>
              <label>
                Titel
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plaat-titel" />
              </label>
              <label>
                Artiest
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artiest" />
              </label>
            </>
          )}

          <label>
            {type === "quote" ? "Quote" : type === "prediction" ? "Voorspelling" : "Verhaal"}
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} required placeholder="Schrijf hier..." />
          </label>

          <label>
            Afbeelding (optioneel)
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </label>

          <button type="submit" disabled={save.isPending}>
            {save.isPending ? "OPSLAAN..." : "OPSLAAN"}
          </button>
          {status && <p className="admin-status">{status}</p>}
        </form>
      </div>
    </main>
  );
}
