// Signal Zine direction: this page behaves like a living broadcast sheet—left-aligned, textured, direct, and built around three weekly transmissions.
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

const transmissions = [
  {
    day: "MONDAY",
    tag: "QUOTES & ALIEN JOKES",
    title: "MORNING TRANSMISSION",
    copy: "Braz wakes up on Earth and drops a quote or alien observation to start your week. Sharp. Honest. Weird.",
    cadence: "Every Monday",
    image: "/manus-storage/moondaymondaymorningquote_a499a598.jpg",
    tone: "yellow",
  },
  {
    day: "WEDNESDAY",
    tag: "BETS & LOTTO",
    title: "GALAXY PREDICTIONS",
    copy: "An alien's take on sports bets and lotto picks. Braz shares a prediction from another galaxy—with the price.",
    cadence: "Every Wednesday",
    image: "/manus-storage/UseAIImageJul3,2026,17_42_46_938911e9.jpeg",
    tone: "pink",
  },
  {
    day: "FRIDAY",
    tag: "VINYL & OLD SCHOOL",
    title: "TGIF VINYL DROP",
    copy: "Old school records. Classic tracks. Every Friday, Braz spins a vinyl and tells the story behind it.",
    cadence: "Every Friday",
    image: "/manus-storage/braz_monkey_no_text_338dba87.webp",
    tone: "red",
  },
];

const heroBackground = "/manus-storage/canonface_30853db0.jpeg";

const navItems = ["signal", "transmissions", "origin", "archive", "follow", "blackbook"];

const SPRAY_COLORS = ["#f5e642", "#ff3e8a", "#ff5c4d", "#f0eee4", "#7ec8ff"];

function SprayCanvas({ onPost, posting }: { onPost: (dataUrl: string) => void; posting: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(SPRAY_COLORS[0]);
  const [radius, setRadius] = useState(18);

  const spray = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;
      const alpha = 0.16 * (1 - r / radius) + 0.05;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, Math.random() * 2.2 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    last.current = p;
    spray(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pos(e);
    const prev = last.current;
    if (prev) {
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      const steps = Math.max(1, Math.floor(dist / 4));
      for (let i = 1; i <= steps; i++) {
        spray(prev.x + ((p.x - prev.x) * i) / steps, prev.y + ((p.y - prev.y) * i) / steps);
      }
    }
    last.current = p;
  };
  const up = () => { drawing.current = false; last.current = null; };
  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const post = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.fillStyle = "#0c0d0c";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);
    onPost(out.toDataURL("image/png"));
    clear();
  };

  return (
    <div className="spray-book">
      <div className="spray-tools">
        {SPRAY_COLORS.map((c) => (
          <button key={c} type="button" className={`spray-color ${c === color ? "active" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Spray color ${c}`} />
        ))}
        <label className="spray-size">NOZZLE
          <input type="range" min={8} max={44} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <button type="button" className="spray-clear" onClick={clear}>CLEAR</button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={560}
        className="spray-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <button type="button" className="button button-primary spray-post" onClick={post} disabled={posting}>{posting ? "POSTING..." : "POST TO BLACKBOOK"} <span>↗</span></button>
    </div>
  );
}

function BlackbookLightbox({ url, tag, onClose }: { url: string; tag: string; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="blackbook-lightbox" onClick={onClose} role="dialog" aria-label={`Graffiti by ${tag}`}>
      <img src={url} alt={`Graffiti by ${tag}`} onClick={(e) => e.stopPropagation()} />
      <p>{tag}</p>
      <button type="button" className="blackbook-lightbox-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

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
      const motionScale = Math.min(1.65, 0.82 + distance / 70);
      const scale = interactive ? 1.75 : motionScale;
      cursorRef.current.dataset.x = String(event.clientX);
      cursorRef.current.dataset.y = String(event.clientY);
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(${scale})`;
    };
    const handleLeave = () => { if (cursorRef.current) cursorRef.current.style.opacity = "0"; };
    const handlePress = (event: PointerEvent) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(1.2)`;
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);
    window.addEventListener("pointerdown", handlePress, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("pointerdown", handlePress);
    };
  }, []);

  return <img ref={cursorRef} className="cursor-follower" src="/manus-storage/braz-monkey-cursor-64-alpha_69db966a.png" alt="" aria-hidden="true" />;
}

function Hot97Player() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const tryAutoplay = async () => {
      if (!audioRef.current) return;
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };
    tryAutoplay();
  }, []);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <aside className={`hot97-player ${expanded ? "is-expanded" : ""}`} aria-label="HOT 97 live player">
      <audio ref={audioRef} src="https://playerservices.streamtheworld.com/api/livestream-redirect/WQHTFM.mp3" preload="none" />
      <button className="hot97-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span className="pulse-dot" />
        <span>HOT 97 LIVE</span>
      </button>
      <div className="hot97-panel">
        <button className="hot97-play" onClick={togglePlayback}>{playing ? "PAUSE" : "PLAY"}</button>
        <p>{playing ? "Streaming live from New York." : "Tap play to start the HOT 97 live stream."}</p>
        <a href="https://www.hot97.com/listen-live/" target="_blank" rel="noopener noreferrer">OPEN OFFICIAL PLAYER ↗</a>
      </div>
    </aside>
  );
}

export default function Home() {
  const [active, setActive] = useState("signal");
  const [menuOpen, setMenuOpen] = useState(false);

  const [blackbookOpen, setBlackbookOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<{ url: string; tag: string } | null>(null);

  const utils = trpc.useUtils();

  const blackbookList = trpc.blackbook.list.useQuery(undefined);
  const uploadMutation = trpc.blackbook.upload.useMutation({
    onSuccess: () => {
      setUploadStatus("success");
      setSelectedFile(null);
      setTagName("");
      setCaption("");
      blackbookList.refetch();
    },
    onError: () => setUploadStatus("error"),
  });
  const tagMutation = trpc.blackbook.tag.useMutation({
    onSuccess: () => {
      setUploadStatus("success");
      setTagName("");
      setCaption("");
      blackbookList.refetch();
    },
    onError: () => setUploadStatus("error"),
  });

  const sprayMutation = trpc.blackbook.upload.useMutation({
    onSuccess: () => {
      utils.blackbook.list.invalidate();
    },
  });

  const postSpray = (dataUrl: string) => {
    const base64 = dataUrl.split(",")[1];
    sprayMutation.mutate({
      tagName: tagName.trim() || "SPRAY TAG",
      caption: caption.trim() || "Drawn in the blackbook",
      fileName: `spray-tag-${Date.now()}.png`,
      fileData: base64,
      mimeType: "image/png",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-30% 0px -55% 0px" },
    );
    navItems.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <CursorFollower />
      <Hot97Player />
      <div className="ticker" aria-label="Braz Monkey transmission ticker">
        <div className="ticker-track">
          {Array.from({ length: 2 }).flatMap((_, repeat) =>
            ["EARTH IS STRANGE", "WE ARE ALL WEIRD", "NO PAST", "NO ENEMIES", "FINDING ROOTS", "OLD SCHOOL VIBES", "BRAZ MONKEY"].map((item) => (
              <span key={`${repeat}-${item}`}><b>{item}</b><i>◈</i></span>
            )),
          )}
        </div>
      </div>

      <header className={`site-header ${menuOpen ? "is-open" : ""}`}>
        <button className="brand" onClick={() => jump("signal")} aria-label="Back to Braz Monkey signal">
          <span className="brand-mark brand-banner"><img src="/manus-storage/braz-monkey-banner-alpha_0cbb9178.png" alt="BRAZ MONKEY" /></span>
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">{menuOpen ? "×" : "☰"}</button>
        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((id, index) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => jump(id)}>
              <span>0{index + 1}</span>{id}
            </button>
          ))}
        </nav>
        <div className="header-status"><span className="live-dot" /> SIGNAL: LIVE</div>
      </header>

      <main>
        <section id="signal" className="hero-section">
          <div className="hero-art" style={{ backgroundImage: `url('${heroBackground}')` }} />
          <div className="hero-grid" />
          <div className="hero-glitch" />
          <div className="hero-copy">
            <p className="eyebrow">// TRANSMISSION INCOMING <span>FM 00.404</span></p>
            <h1 className="glitch-title" data-text="BRAZ MONKEY">BRAZ<br /><em>MONKEY</em></h1>
            <p className="hero-description">An alien with no origin, no history. Just landed on Earth and trying to figure it all out—one Monday quote, one bet, one vinyl record at a time.</p>
            <div className="hero-actions"><button className="button button-primary" onClick={() => jump("transmissions")}>FOLLOW THE SIGNAL <span>↗</span></button><button className="button button-ghost" onClick={() => jump("origin")}>THE STORY <span>→</span></button></div>
          </div>
          <div className="hero-index"><span>01</span><i />05</div>
          <div className="scroll-cue">SCROLL TO TUNE IN <span>↓</span></div>
        </section>

        <section id="transmissions" className="section transmissions-section">
          <div className="section-heading"><div><p className="eyebrow">// WEEKLY TRANSMISSIONS</p><h2>THE<br /><em>CONTENT</em></h2></div><p className="section-note">Three signals. One strange planet.<br />New transmissions every week.</p></div>
          <div className="transmission-list">
            {transmissions.map((item, index) => (
              <article className={`transmission-card tone-${item.tone}`} key={item.day}>
                <div className="card-meta"><span>0{index + 1}</span><b>{item.day}</b><small>{item.cadence}</small><i className="card-signal-mark">◈</i></div>
                <div className={`card-image card-image-${item.tone}`}><img src={item.image} alt={`${item.day} Braz Monkey transmission`} onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="image-fallback">IMAGE<br />SIGNAL<br />LOST</span></div>
                <div className="card-content"><p className="eyebrow">{item.tag}</p><h3>{item.title}</h3><p>{item.copy}</p><button className="text-link" onClick={() => jump("archive")}>SEE EPISODES <span>→</span></button></div>
              </article>
            ))}
          </div>
        </section>

        <section id="origin" className="section origin-section">
          <div className="origin-stamp">ORIGIN<br /><strong>UNKNOWN</strong><br />FILE 00.404</div>
          <div className="origin-copy"><p className="eyebrow">// ORIGIN FILE: UNKNOWN</p><h2>NO MANUAL.<br /><em>NO MAP.</em></h2><p>Somewhere between a galaxy that does not exist on any map and a planet that is still figuring out WiFi, Braz Monkey landed. No spaceship. No manual. No idea what a Monday is.</p><p>Every week he transmits what he finds—quotes that hit different, predictions from another dimension, and vinyl records that might hold the key to who he actually is.</p><button className="button button-primary" onClick={() => jump("follow")}>PICK UP THE SIGNAL <span>↗</span></button></div>
          <div className="origin-number">02<span>/</span>05</div>
        </section>

        <section id="archive" className="section archive-section">
          <div className="section-heading"><div><p className="eyebrow">// SIGNAL ARCHIVE</p><h2>THE<br /><em>ARCHIVE</em></h2></div><p className="section-note">A record of everything Braz<br />has intercepted so far.</p></div>
          <div className="archive-panel"><div className="archive-ring archive-photo" style={{ backgroundImage: "url('/manus-storage/PHOTO-2026-05-30-16-36-06_4e30a110.jpg')" }}><span>TRANSMISSION<br />ARCHIVE</span></div><div><p className="archive-code">ARCHIVE STATUS: RECEIVING</p><h3>THE SIGNAL<br /><em>NEVER STOPS.</em></h3><p>Browse the transmissions as they land. Visual fragments, late-night observations, and clues from the long way home.</p></div><button className="button button-ghost" onClick={() => jump("transmissions")}>BROWSE SIGNALS <span>→</span></button></div>
          <div className="archive-video">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/FHYPykOT35Q?si=DJOq3b0BzxS8LJbJ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
          </div>
        </section>

        <section id="follow" className="section follow-section">
          <div className="follow-art" style={{ backgroundImage: "url('/manus-storage/follow-silhouette-vignette_f7d1dd0e.png')" }} />
          <div className="follow-copy"><p className="eyebrow">// PICK UP THE SIGNAL</p><h2>FOLLOW THE<br /><em>JOURNEY</em></h2><p>Three transmissions a week. Every week. Braz is still figuring out this planet—follow along so you do not miss a signal.</p><div className="social-links"><a href="https://www.facebook.com/BRAZM0NKEY/" target="_blank" rel="noreferrer">FACEBOOK <span>↗</span></a><a href="#follow" onClick={(event) => event.preventDefault()}>YOUTUBE <span>↗</span></a><a href="#follow" onClick={(event) => event.preventDefault()}>INSTAGRAM <span>↗</span></a></div></div>
        </section>

        <section id="blackbook" className="section blackbook-section">
          <div className="section-heading"><div><p className="eyebrow">// BLACKBOOK</p><h2>LEAVE YOUR<br /><em>TAG</em></h2></div><p className="section-note">A personal sketchbook for graffiti writers to practice lettering, test color schemes, and develop new design concepts before painting them on public or legal surfaces.</p></div>
          <div className="blackbook-panel">
            <div className="blackbook-copy"><p className="eyebrow">// BLACKBOOK</p><h3>LEAVE YOUR<br /><em>MARK.</em></h3><p>Leave your tag or upload your graffiti of Braz Monkey. This is a personal sketchbook for practice, color tests, and new concepts.</p></div>
            <div className="blackbook-actions">
              <button className="button button-primary" onClick={() => setBlackbookOpen(!blackbookOpen)}>LEAVE A TAG <span>↗</span></button>
              <button className="button button-ghost" onClick={() => fileInputRef.current?.click()}>UPLOAD GRAFFITI <span>→</span></button>
              <button className="button button-ghost disclaimer-toggle" type="button" onClick={() => setDisclaimerOpen(!disclaimerOpen)} aria-expanded={disclaimerOpen}>DISCLAIMER <span>?</span></button>
            </div>
          </div>
          <div className={`disclaimer-panel ${disclaimerOpen ? "is-open" : ""}`} aria-hidden={!disclaimerOpen}>
            <div className="disclaimer-content">
              <h4>Disclaimer</h4>
              <p><strong>1. Promotional and Informational Use Only</strong><br />All content, information, and materials provided on this website are for promotional and general informational purposes only. The information is not intended to be, and should not be taken as, professional, legal, financial, or medical advice. [1] (https://www.webador.com/blog/privacy-cookies-and-more-is-your-website-legally-compliant/), [2] (https://www.iubenda.com/en/blog/disclaimer-examples/), [3] (https://qodeinteractive.com/magazine/must-have-legal-pages-for-any-wordpress-website/)</p>
              <p><strong>2. No Warranties (Use at Your Own Risk)</strong><br />While I try to provide accurate information, I make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of the information contained on this website. Any reliance you place on such information is strictly at your own risk. [1] (https://www.linkedin.com/pulse/how-legal-disclaimers-work-websites-colin-a-ward-6073491882632048640), [2] (https://www.webador.com/blog/privacy-cookies-and-more-is-your-website-legally-compliant/)</p>
              <p><strong>3. Limitation of Liability</strong><br />In no event will I be held liable for any loss or damage, including without limitation, indirect or consequential loss or damage, arising from or in connection with the use of this website. You are solely responsible for any actions you take based on the information provided on this website. [1] (https://termly.io/faq/do-i-need-a-disclaimer-on-my-website/), [2] (https://www.linkedin.com/pulse/how-legal-disclaimers-work-websites-colin-a-ward-6073491882632048640), [3] (https://usercentrics.com/guides/website-disclaimers/disclaimer-examples/)</p>
              <p><strong>4. External Links</strong><br />Through this website, you may be able to link to other websites which are not under my control. I have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.</p>
            </div>
          </div>

          {blackbookOpen && (
            <div className="blackbook-form">
              <input type="text" placeholder="YOUR TAG NAME" value={tagName} onChange={(e) => setTagName(e.target.value)} className="blackbook-input" />
              <textarea placeholder="CAPTION OR MESSAGE (OPTIONAL)" value={caption} onChange={(e) => setCaption(e.target.value)} className="blackbook-textarea" />
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              {selectedFile && <p className="blackbook-file">{selectedFile.name}</p>}
              <div className="blackbook-form-actions">
                {selectedFile ? (
                  <button className="button button-primary" onClick={async () => {
                    if (!selectedFile || !tagName.trim()) return;
                    setUploadStatus("uploading");
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = (reader.result as string).split(",")[1];
                      uploadMutation.mutate({ tagName, caption, fileName: selectedFile.name, fileData: base64, mimeType: selectedFile.type });
                    };
                    reader.readAsDataURL(selectedFile);
                  }} disabled={uploadStatus === "uploading"}>{uploadStatus === "uploading" ? "UPLOADING..." : "UPLOAD GRAFFITI"}</button>
                ) : (
                  <button className="button button-primary" onClick={() => tagMutation.mutate({ tagName, caption })} disabled={!tagName.trim() || uploadStatus === "uploading"}>LEAVE A TAG</button>
                )}
              </div>
              {uploadStatus === "success" && <p className="blackbook-status success">TAG / UPLOAD SAVED.</p>}
              {uploadStatus === "error" && <p className="blackbook-status error">UPLOAD FAILED. TRY AGAIN.</p>}
            </div>
          )}

          {blackbookList.data && blackbookList.data.length > 0 && (
            <div className="blackbook-gallery">
              {blackbookList.data.map((entry) => (
                <button key={entry.id} type="button" className="blackbook-entry" onClick={() => entry.fileUrl && setLightbox({ url: entry.fileUrl, tag: entry.tagName })}>
                  {entry.fileUrl && <img src={entry.fileUrl} alt={entry.tagName} className="blackbook-thumb" />}
                  <p className="blackbook-entry-tag">{entry.tagName}</p>
                  {entry.caption && <p className="blackbook-entry-caption">{entry.caption}</p>}
                </button>
              ))}
            </div>
          )}
          <SprayCanvas onPost={postSpray} posting={sprayMutation.isPending} />
        </section>
      </main>

      {lightbox && <BlackbookLightbox url={lightbox.url} tag={lightbox.tag} onClose={() => setLightbox(null)} />}

      <footer className="site-footer"><div className="footer-brand"><img src="/manus-storage/braz-monkey-banner_8e9fcbe1.png" alt="BRAZ MONKEY" /><span>BRAZ MONKEY</span></div><p>Still figuring out this planet. Follow along.</p><span>© 2026 BRAZ MONKEY UNIVERSE</span></footer>
    </div>
  );
}
