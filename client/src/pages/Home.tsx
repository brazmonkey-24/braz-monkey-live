// Signal Zine direction: this page behaves like a living broadcast sheet—left-aligned, textured, direct, and built around three weekly transmissions.
import { useEffect, useRef, useState } from "react";

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
    image: "/manus-storage/MIEKWERK1_b2e42f29.webp",
    tone: "red",
  },
];

const navItems = ["signal", "transmissions", "origin", "archive", "follow"];

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
      const motionScale = Math.min(1.45, 0.82 + distance / 90);
      const scale = interactive ? 1.55 : motionScale;
      cursorRef.current.dataset.x = String(event.clientX);
      cursorRef.current.dataset.y = String(event.clientY);
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(${scale})`;
    };
    const handleLeave = () => { if (cursorRef.current) cursorRef.current.style.opacity = "0"; };
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return <img ref={cursorRef} className="cursor-follower" src="/manus-storage/braz-monkey-cursor-64-alpha_69db966a.png" alt="" aria-hidden="true" />;
}

function Hot97Player() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
          <span className="brand-mark brand-banner"><img src="/manus-storage/braz-monkey-banner_8e9fcbe1.png" alt="BRAZ MONKEY" /></span>
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
          <div className="hero-art" style={{ backgroundImage: "url('/manus-storage/t12iticu_a8298428.jpg')" }} />
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
        </section>

        <section id="follow" className="section follow-section">
          <div className="follow-art" style={{ backgroundImage: "url('/manus-storage/arcade_8f34d1f6.jpeg')" }} />
          <div className="follow-copy"><p className="eyebrow">// PICK UP THE SIGNAL</p><h2>FOLLOW THE<br /><em>JOURNEY</em></h2><p>Three transmissions a week. Every week. Braz is still figuring out this planet—follow along so you do not miss a signal.</p><div className="social-links"><a href="https://www.facebook.com/BRAZM0NKEY/" target="_blank" rel="noreferrer">FACEBOOK <span>↗</span></a><a href="#follow" onClick={(event) => event.preventDefault()}>YOUTUBE <span>↗</span></a><a href="#follow" onClick={(event) => event.preventDefault()}>INSTAGRAM <span>↗</span></a></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><img src="/manus-storage/braz-monkey-banner_8e9fcbe1.png" alt="BRAZ MONKEY" /><span>BRAZ MONKEY</span></div><p>Still figuring out this planet. Follow along.</p><span>© 2026 BRAZ MONKEY UNIVERSE</span></footer>
    </div>
  );
}
