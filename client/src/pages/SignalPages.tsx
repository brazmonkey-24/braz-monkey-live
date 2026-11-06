import { ReactNode, useEffect, useRef } from "react";
import { ArrowUpRight, BookOpen, ExternalLink, Radio, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PAGE_LINKS } from "@/lib/siteNavigation";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";

const media = [
  { src: "/manus-storage/canonface_30853db0.jpeg", label: "ORIGIN / FACE FILE", tone: "yellow" },
  { src: "/manus-storage/moondaymondaymorningquote_a499a598.jpg", label: "MONDAY / MORNING TRANSMISSION", tone: "pink" },
  { src: "/manus-storage/UseAIImageJul3,2026,17_42_46_938911e9.jpeg", label: "WEDNESDAY / GALAXY PREDICTIONS", tone: "red" },
  { src: "/manus-storage/braz_monkey_no_text_338dba87.webp", label: "FRIDAY / TGIF VINYL DROP", tone: "yellow" },
  { src: "/manus-storage/PHOTO-2026-05-30-16-36-06_4e30a110.jpg", label: "ARCHIVE / SIGNAL FRAGMENT", tone: "pink" },
];

const videos = [
  ["xEF0hudLJBI", "WAKE UP 21 APRIL 2018"],
  ["8HZ8YQgnpVw", "TOLLIE D WREDE SYFILIS"],
  ["Xt74oL9FWqA", "MILLENNIUMMIEK FT MAYLAY SPARKS"],
  ["HOMrw2qQOd8", "ENERGIERAMP ROBOTIX VOL 1"],
  ["PKpmTHKZ9pU", "RAYMZTER FT ROBOTIX"],
  ["SYiFeoonNd8", "HE LIVES IN THE STATIC EVERYONE ELSE SKIPS"],
] as const;

const pageLinks = PAGE_LINKS;

function SiteFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: string; children: ReactNode }) {
  return <div className="signal-page-shell">
    <div className="ticker"><div className="ticker-track">{["EARTH IS STRANGE", "WE ARE ALL WEIRD", "NO PAST", "NO ENEMIES", "FINDING ROOTS", "OLD SCHOOL VIBES"].map((item, i) => <span key={`${item}-${i}`}><b>{item}</b><i>◈</i></span>)}</div></div>
    <header className="signal-page-header">
      <a className="signal-page-brand" href="/" aria-label="Back to Braz Monkey home"><img src="/manus-storage/braz-monkey-banner-alpha_0cbb9178.png" alt="Braz Monkey" /></a>
      <nav className="signal-page-nav" aria-label="Site pages">
        <a href="/">01 SIGNAL</a>{pageLinks.map(([label, href], i) => <a key={href} href={href} data-store-link={label === "SHOP" ? "true" : undefined} data-game-link={label === "GAME" ? "true" : undefined}>{String(i + 2).padStart(2, "0")} {label}</a>)}
      </nav>
      <span className="header-status"><span className="live-dot" /> SIGNAL: LIVE</span>
    </header>
    <main className="signal-page-main">
      <div className="signal-page-intro"><div><p className="eyebrow">// {eyebrow}</p><h1>{title}</h1></div><p className="signal-page-lede">{intro}</p></div>
      {children}
    </main>
    <FooterDisclaimer />
    <footer className="signal-page-footer"><a href="/">← RETURN TO THE SIGNAL</a><span>© 2026 BRAZ MONKEY UNIVERSE</span></footer>
  </div>;
}

function ArchivePostImage({ src, alt, type }: { src?: string | null; alt: string; type: "quote" | "prediction" | "vinyl" }) {
  const fallback = type === "quote" ? media[1].src : type === "prediction" ? media[2].src : media[3].src;
  return <img src={src || fallback} alt={alt} onError={(event) => { if (event.currentTarget.src.endsWith(fallback)) return; event.currentTarget.src = fallback; }} />;
}

export function TransmissionsPage() {
  const { data: posts } = trpc.content.list.useQuery(undefined, { refetchInterval: 15000 });
  const groupedPosts = (type: "quote" | "prediction" | "vinyl") => (posts ?? []).filter((post) => post.type === type).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const latestByType = (posts ?? []).reduce<Partial<Record<"quote" | "prediction" | "vinyl", NonNullable<typeof posts>[number]>>>((latest, post) => { if (!latest[post.type] || +new Date(post.createdAt) > +new Date(latest[post.type]!.createdAt)) latest[post.type] = post; return latest; }, {});
  const isNew = (createdAt: Date | string) => Date.now() - +new Date(createdAt) <= 7 * 24 * 60 * 60 * 1000;
  const slots = ["quote", "prediction", "vinyl"] as const;
  const copy = ["Quotes, alien jokes, and a sharp thought to start the week.", "A playful look at bets and lotto picks. Entertainment only.", "Old-school records and the story behind the spin."];
  const titles = ["MORNING TRANSMISSION", "GALAXY PREDICTIONS", "TGIF VINYL DROP"];
  return <SiteFrame eyebrow="WEEKLY TRANSMISSIONS" title={<>THE <em>CONTENT</em></>} intro="Three recurring signals from the alien weekly desk. Browse the drops, then tune into the archive for the older frequencies.">
    <div className="page-card-grid transmission-page-grid">{media.slice(1, 4).map((item, i) => { const type = slots[i]; const post = latestByType[type]; const releases = groupedPosts(type); const currentIndex = post ? releases.findIndex((release) => release.id === post.id) : -1; const previous = currentIndex >= 0 ? releases[currentIndex + 1] : undefined; const next = currentIndex > 0 ? releases[currentIndex - 1] : undefined; return <article className={`page-media-card tone-${item.tone}`} key={item.src}><div className="transmission-card-image"><ArchivePostImage src={post?.imageUrl} alt={post?.title || item.label} type={type} />{post && isNew(post.createdAt) && <span className="transmission-new-badge">NEW</span>}</div><div><span>0{i + 1} / {item.label}</span><h2>{post?.title || titles[i]}</h2><p>{post?.body || copy[i]}</p>{post && <small className="transmission-sync-note">LATEST CMS RELEASE / {new Date(post.createdAt).toLocaleDateString()}</small>}<div className="transmission-card-actions"><a href={previous ? `/archive/post/${previous.id}` : "#"} aria-disabled={!previous} className={!previous ? "is-disabled" : ""}>← PREVIOUS</a><a href={post ? `/archive/post/${post.id}` : "/archive"}>OPEN FULL RELEASE <ArrowUpRight size={14} /></a><a href={next ? `/archive/post/${next.id}` : "#"} aria-disabled={!next} className={!next ? "is-disabled" : ""}>NEXT →</a></div></div></article>; })}</div>
  </SiteFrame>;
}

export function OriginPage() {
  return <SiteFrame eyebrow="ORIGIN FILE: UNKNOWN" title={<>NO MANUAL.<br /><em>NO MAP.</em></>} intro="Somewhere between a galaxy that does not exist on any map and a planet still figuring out WiFi, Braz Monkey landed.">
    <div className="origin-page-layout"><div className="origin-page-art"><img src={media[0].src} alt="Braz Monkey origin file" /><span>FILE 00.404 / ORIGIN UNKNOWN</span></div><div className="page-copy-stack"><p>Every week Braz transmits what he finds—quotes that hit different, predictions from another dimension, and vinyl records that might hold the key to who he actually is.</p><p>There is no spaceship. No manual. No idea what a Monday is. There is only the signal, the archive, and the people who keep tuning in.</p><a className="page-action" href="/transmissions">READ THE WEEKLY SIGNAL <ArrowUpRight size={14} /></a></div></div>
    <div className="media-mosaic">{media.slice(1).map((item) => <figure key={item.src}><img src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div>
  </SiteFrame>;
}

export function ArchivePage() {
  const { data: posts, isLoading } = trpc.content.list.useQuery(undefined, { refetchInterval: 15000 });
  const groups = [
    { type: "quote" as const, label: "MONDAY QUOTES", eyebrow: "01 / MONDAY MORNING", intro: "Quotes, alien jokes, and sharp thoughts to start the week." },
    { type: "prediction" as const, label: "WEDNESDAY PREDICTIONS", eyebrow: "02 / WEDNESDAY TRANSMISSION", intro: "Predictions from another dimension. Entertainment only." },
    { type: "vinyl" as const, label: "FRIDAY VINYL DROPS", eyebrow: "03 / FRIDAY FREQUENCY", intro: "Old-school records, stories, and the sound behind the signal." },
  ];
  return <SiteFrame eyebrow="SIGNAL ARCHIVE" title={<>THE <em>ARCHIVE</em></>} intro="Every CMS post, every image, every weekly frequency. Choose a map to open the complete content stream.">
    <div className="archive-map-grid">{groups.map((group) => { const items = (posts ?? []).filter((post) => post.type === group.type); return <section className={`archive-map archive-map-${group.type}`} key={group.type}><div className="archive-map-head"><div><p className="eyebrow">// {group.eyebrow}</p><h2>{group.label}</h2><p>{group.intro}</p></div><strong>{String(items.length).padStart(2, "0")} POSTS</strong></div>{isLoading ? <p className="archive-empty">LOADING SIGNALS...</p> : items.length === 0 ? <p className="archive-empty">NO POSTS IN THIS MAP YET.</p> : <div className="archive-post-grid">{items.map((post) => <a className="archive-post-card" href={`/archive/post/${post.id}`} key={post.id}><ArchivePostImage src={post.imageUrl} alt={post.title || `${group.label} image`} type={group.type} /><div className="archive-post-card-copy"><span>{new Date(post.createdAt).toLocaleDateString()}</span><h3>{post.title || (group.type === "vinyl" ? "VINYL DROP" : group.label)}</h3>{post.artist && <small>{post.artist}</small>}<p>{post.body}</p><b>OPEN FULL POST <ArrowUpRight size={14} /></b></div></a>)}</div>}</section>; })}</div>
    <section className="archive-video-section"><div className="archive-map-head"><div><p className="eyebrow">// SIGNAL FRAGMENTS</p><h2>VIDEO ARCHIVE</h2></div><a href="#video-archive">WATCH ALL <ArrowUpRight size={14} /></a></div><div id="video-archive" className="archive-page-grid">{videos.map(([id, title], i) => <figure className="archive-page-video" key={id}><div><iframe src={`https://www.youtube.com/embed/${id}`} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><figcaption><span>0{i + 1}</span>{title}</figcaption></figure>)}</div></section>
  </SiteFrame>;
}

export function CmsPostPage({ id }: { id: number }) {
  const { data: post, isLoading } = trpc.content.byId.useQuery({ id });
  const labels = { quote: "MONDAY QUOTE", prediction: "WEDNESDAY PREDICTION", vinyl: "FRIDAY VINYL DROP" };
  return <SiteFrame eyebrow={post ? labels[post.type] : "ARCHIVE POST"} title={post ? <>{post.title || labels[post.type]}</> : <>SIGNAL <em>LOADING</em></>} intro="A complete Braz Monkey archive transmission, preserved from the CMS and available as a full signal page.">
    {isLoading ? <p className="archive-empty">LOADING POST...</p> : !post ? <div className="page-panel"><h2>POST NOT FOUND.</h2><a href="/archive">← BACK TO ARCHIVE</a></div> : <article className="cms-post-detail"><ArchivePostImage src={post.imageUrl} alt={post.title || labels[post.type]} type={post.type} /><div className="cms-post-detail-copy"><p className="eyebrow">// {labels[post.type]} / {new Date(post.createdAt).toLocaleDateString()}</p>{post.artist && <p className="cms-post-artist">{post.artist}</p>}<p className="cms-post-body">{post.body}</p><a className="page-action" href="/archive">← BACK TO ARCHIVE <ArrowUpRight size={14} /></a></div></article>}
  </SiteFrame>;
}

export function FollowPage() {
  return <SiteFrame eyebrow="PICK UP THE SIGNAL" title={<>FOLLOW THE<br /><em>JOURNEY</em></>} intro="Three transmissions a week. Every week. Follow along so you do not miss a signal.">
    <div className="follow-page-hero"><img src={media[4].src} alt="Braz Monkey signal fragment" /><div><Radio size={24} /><h2>THE SIGNAL<br /><em>NEVER STOPS.</em></h2><p>Find Braz Monkey across the places where old-school stories, alien observations, and visual noise gather.</p><div className="page-social-links"><a href="https://www.facebook.com/BRAZM0NKEY/" target="_blank" rel="noreferrer">FACEBOOK <ExternalLink size={14} /></a><a href="https://www.youtube.com/@13VIERENTWINTIG" target="_blank" rel="noreferrer">YOUTUBE <ExternalLink size={14} /></a><a href="https://www.instagram.com/brazm0nkey/" target="_blank" rel="noreferrer">INSTAGRAM <ExternalLink size={14} /></a></div></div></div>
    <section className="embedsocial-wall" aria-labelledby="embedsocial-wall-title">
      <div className="embedsocial-wall-heading"><div><p className="eyebrow">// LIVE SOCIAL SIGNAL</p><h2 id="embedsocial-wall-title">BRAZ <em>IN THE WILD.</em></h2></div><a href="https://embedsocial.com/" target="_blank" rel="noreferrer">POWERED BY EMBEDSOCIAL <ExternalLink size={13} /></a></div>
      <div className="embedsocial-frame-wrap"><iframe title="Braz Monkey live social feed" src="https://embedsocial.com/api/pro_hashtag/3f9e18dd47f95d168eb6ef695dff1d7bc5da03e7/" loading="eager" /></div>
    </section>
  </SiteFrame>;
}

export function BlackbookPage() {
  return <SiteFrame eyebrow="BLACKBOOK" title={<>LEAVE YOUR<br /><em>TAG</em></>} intro="A personal sketchbook for graffiti writers to practice lettering, test color schemes, and develop new design concepts.">
    <div className="blackbook-page-grid"><article className="page-panel"><BookOpen size={22} /><h2>DRAW IT.<br /><em>SAVE IT.</em></h2><p>The interactive spray canvas still lives on the home signal. Open it, make a mark, and post your piece to the Blackbook gallery.</p><a href="/#blackbook">OPEN THE SPRAY CANVAS <ArrowUpRight size={14} /></a></article><article className="page-panel page-poster"><Sparkles size={22} /><p className="eyebrow">// FIELD RULE</p><h2>NO WALL<br /><em>WITHOUT A STORY.</em></h2><p>Use the page to test colors, lettering, and new concepts before painting public or legal surfaces.</p></article></div><div className="media-mosaic blackbook-media">{media.map((item) => <figure key={item.src}><img src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div>
  </SiteFrame>;
}
