import { trpc } from "@/lib/trpc";

export default function Media() {
  const cms = trpc.content.list.useQuery(undefined);
  const blackbook = trpc.blackbook.list.useQuery(undefined);

  const cmsImages = (cms.data ?? [])
    .filter((item) => item.imageUrl)
    .map((item) => ({
      id: `cms-${item.id}`,
      src: item.imageUrl as string,
      title: item.title || item.type,
      subtitle: item.artist || item.type,
      date: item.createdAt,
    }));

  const blackbookImages = (blackbook.data ?? [])
    .filter((entry) => entry.fileUrl)
    .map((entry) => ({
      id: `bb-${entry.id}`,
      src: entry.fileUrl as string,
      title: entry.tagName,
      subtitle: entry.caption || "blackbook",
      date: entry.createdAt,
    }));

  const all = [...cmsImages, ...blackbookImages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="media-shell">
      <header className="media-header">
        <p className="eyebrow">// STORAGE MAP</p>
        <h1>MEDIA ARCHIVE</h1>
        <p>Alle opgeslagen afbeeldingen — CMS en Blackbook — op één plek.</p>
      </header>
      {all.length === 0 && <p className="media-empty">Nog geen afbeeldingen opgeslagen.</p>}
      <div className="media-grid">
        {all.map((img) => (
          <figure key={img.id} className="media-card">
            <a href={img.src} target="_blank" rel="noreferrer">
              <img src={img.src} alt={img.title} loading="lazy" />
            </a>
            <figcaption>
              <strong>{img.title}</strong>
              <span>{img.subtitle}</span>
              <time>{new Date(img.date).toLocaleDateString("nl-NL")}</time>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
