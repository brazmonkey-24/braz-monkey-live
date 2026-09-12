import { ReactNode, useEffect, useRef } from "react";
import { Activity, ArrowUpRight, BookOpen, ExternalLink, Image as ImageIcon, Radio, Sparkles } from "lucide-react";

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
] as const;

const pageLinks = [
  ["TRANSMISSIONS", "/transmissions"], ["TELEMETRY", "/telemetry"], ["ORIGIN", "/origin"],
  ["ARCHIVE", "/archive"], ["FOLLOW", "/follow"], ["BLACKBOOK", "/blackbook"],
] as const;

function CursorFollower() {
  const cursorRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !cursorRef.current) return;
      const target = event.target as HTMLElement;
      const interactive = Boolean(target.closest("a, button"));
      const lastX = Number(cursorRef.current.dataset.x || event.clientX);
      const lastY = Number(cursorRef.current.dataset.y || event.clientY);
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      const scale = interactive ? 1.75 : Math.min(1.65, 0.82 + distance / 70);
      cursorRef.current.dataset.x = String(event.clientX);
      cursorRef.current.dataset.y = String(event.clientY);
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(${scale})`;
    };
    const handlePress = (event: PointerEvent) => { if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(1.2)`; };
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handlePress, { passive: true });
    return () => { window.removeEventListener("pointermove", handleMove); window.removeEventListener("pointerdown", handlePress); };
  }, []);
  return <img ref={cursorRef} className="cursor-follower" src="/manus-storage/braz-monkey-cursor-64-alpha_69db966a.png" alt="" aria-hidden="true" />;
}

function SiteFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: string; children: ReactNode }) {
  return <div className="signal-page-shell">
    <CursorFollower />
    <div className="ticker"><div className="ticker-track">{["EARTH IS STRANGE", "WE ARE ALL WEIRD", "NO PAST", "NO ENEMIES", "FINDING ROOTS", "OLD SCHOOL VIBES"].map((item, i) => <span key={`${item}-${i}`}><b>{item}</b><i>◈</i></span>)}</div></div>
    <header className="signal-page-header">
      <a className="signal-page-brand" href="/" aria-label="Back to Braz Monkey home"><img src="/manus-storage/braz-monkey-banner-alpha_0cbb9178.png" alt="Braz Monkey" /></a>
      <nav className="signal-page-nav" aria-label="Site pages">
        <a href="/">01 SIGNAL</a>{pageLinks.map(([label, href], i) => <a key={href} href={href}>{String(i + 2).padStart(2, "0")} {label}</a>)}
      </nav>
      <span className="header-status"><span className="live-dot" /> SIGNAL: LIVE</span>
    </header>
    <main className="signal-page-main">
      <div className="signal-page-intro"><div><p className="eyebrow">// {eyebrow}</p><h1>{title}</h1></div><p className="signal-page-lede">{intro}</p></div>
      {children}
    </main>
    <footer className="signal-page-footer"><a href="/">← RETURN TO THE SIGNAL</a><span>© 2026 BRAZ MONKEY UNIVERSE</span></footer>
  </div>;
}

export function TransmissionsPage() {
  return <SiteFrame eyebrow="WEEKLY TRANSMISSIONS" title={<>THE <em>CONTENT</em></>} intro="Three recurring signals from the alien weekly desk. Browse the drops, then tune into the archive for the older frequencies.">
    <div className="page-card-grid transmission-page-grid">{media.slice(1, 4).map((item, i) => <article className={`page-media-card tone-${item.tone}`} key={item.src}><img src={item.src} alt={item.label} /><div><span>0{i + 1} / {item.label}</span><h2>{["MORNING TRANSMISSION", "GALAXY PREDICTIONS", "TGIF VINYL DROP"][i]}</h2><p>{["Quotes, alien jokes, and a sharp thought to start the week.", "A playful look at bets and lotto picks. Entertainment only.", "Old-school records and the story behind the spin."][i]}</p><a href="/archive">SEE SIGNAL ARCHIVE <ArrowUpRight size={14} /></a></div></article>)}</div>
  </SiteFrame>;
}

export function TelemetryPage() {
  return <SiteFrame eyebrow="SIGNAL TELEMETRY" title={<>THE <em>NUMBERS</em></>} intro="A broadcast-room view of the Braz Monkey universe: attention, content gravity, and where the signal is travelling.">
    <div className="page-kpi-grid">{[["47,780", "VISITORS FOUND THE SIGNAL"], ["28,490", "SIGNAL RETURNS"], ["42.1%", "CONTENT GRAVITY"], ["05:02", "AVG. TRANSMISSION TIME"]].map(([value, label]) => <div className="page-kpi" key={label}><span>{label}</span><strong>{value}</strong><small>▲ 12.4% / LIVE READ</small></div>)}</div>
    <div className="page-two-column"><article className="page-panel"><p className="eyebrow">// WHERE IT LANDS</p><h2>THE SIGNAL<br /><em>TRAVELS.</em></h2><div className="page-bars">{[["NETHERLANDS", "78%"], ["UNITED KINGDOM", "62%"], ["GERMANY", "49%"], ["USA", "38%"]].map(([label, value]) => <div key={label}><span>{label}</span><b style={{ width: value }} /><strong>{value}</strong></div>)}</div></article><article className="page-panel page-note-panel"><Activity size={22} /><p className="eyebrow">// FIELD NOTE 00.404</p><h2>NO STATIC.<br /><em>JUST SIGNAL.</em></h2><p>The numbers are a living sketch of the people finding Braz between transmissions. This is not a manual. It is a map of strange attention.</p><a href="/follow">PICK UP THE SIGNAL <ArrowUpRight size={14} /></a></article></div>
  </SiteFrame>;
}

export function OriginPage() {
  return <SiteFrame eyebrow="ORIGIN FILE: UNKNOWN" title={<>NO MANUAL.<br /><em>NO MAP.</em></>} intro="Somewhere between a galaxy that does not exist on any map and a planet still figuring out WiFi, Braz Monkey landed.">
    <div className="origin-page-layout"><div className="origin-page-art"><img src={media[0].src} alt="Braz Monkey origin file" /><span>FILE 00.404 / ORIGIN UNKNOWN</span></div><div className="page-copy-stack"><p>Every week Braz transmits what he finds—quotes that hit different, predictions from another dimension, and vinyl records that might hold the key to who he actually is.</p><p>There is no spaceship. No manual. No idea what a Monday is. There is only the signal, the archive, and the people who keep tuning in.</p><a className="page-action" href="/transmissions">READ THE WEEKLY SIGNAL <ArrowUpRight size={14} /></a></div></div>
    <div className="media-mosaic">{media.slice(1).map((item) => <figure key={item.src}><img src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div>
  </SiteFrame>;
}

export function ArchivePage() {
  return <SiteFrame eyebrow="SIGNAL ARCHIVE" title={<>THE <em>ARCHIVE</em></>} intro="A record of everything Braz has intercepted so far. Visual fragments, old-school energy, and clues from the long way home.">
    <div className="archive-page-grid">{videos.map(([id, title], i) => <figure className="archive-page-video" key={id}><div><iframe src={`https://www.youtube.com/embed/${id}`} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><figcaption><span>0{i + 1}</span>{title}</figcaption></figure>)}</div>
  </SiteFrame>;
}

export function FollowPage() {
  return <SiteFrame eyebrow="PICK UP THE SIGNAL" title={<>FOLLOW THE<br /><em>JOURNEY</em></>} intro="Three transmissions a week. Every week. Follow along so you do not miss a signal.">
    <div className="follow-page-hero"><img src={media[4].src} alt="Braz Monkey signal fragment" /><div><Radio size={24} /><h2>THE SIGNAL<br /><em>NEVER STOPS.</em></h2><p>Find Braz Monkey across the places where old-school stories, alien observations, and visual noise gather.</p><div className="page-social-links"><a href="https://www.facebook.com/BRAZM0NKEY/" target="_blank" rel="noreferrer">FACEBOOK <ExternalLink size={14} /></a><a href="https://www.youtube.com/@13VIERENTWINTIG" target="_blank" rel="noreferrer">YOUTUBE <ExternalLink size={14} /></a><a href="https://www.instagram.com/brazm0nkey/" target="_blank" rel="noreferrer">INSTAGRAM <ExternalLink size={14} /></a></div></div></div>
  </SiteFrame>;
}

export function BlackbookPage() {
  return <SiteFrame eyebrow="BLACKBOOK" title={<>LEAVE YOUR<br /><em>TAG</em></>} intro="A personal sketchbook for graffiti writers to practice lettering, test color schemes, and develop new design concepts.">
    <div className="blackbook-page-grid"><article className="page-panel"><BookOpen size={22} /><h2>DRAW IT.<br /><em>SAVE IT.</em></h2><p>The interactive spray canvas still lives on the home signal. Open it, make a mark, and post your piece to the Blackbook gallery.</p><a href="/#blackbook">OPEN THE SPRAY CANVAS <ArrowUpRight size={14} /></a></article><article className="page-panel page-poster"><Sparkles size={22} /><p className="eyebrow">// FIELD RULE</p><h2>NO WALL<br /><em>WITHOUT A STORY.</em></h2><p>Use the page to test colors, lettering, and new concepts before painting public or legal surfaces.</p></article></div><div className="media-mosaic blackbook-media">{media.map((item) => <figure key={item.src}><img src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div>
  </SiteFrame>;
}
