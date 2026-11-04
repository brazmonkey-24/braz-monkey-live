// Signal Zine direction: this page behaves like a living broadcast sheet—left-aligned, textured, direct, and built around three weekly transmissions.
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { SignalAnalytics } from "@/components/SignalAnalytics";
import { BrazMonkeyChat } from "@/components/BrazMonkeyChat";
import { BrazMonkeySignalPopup } from "@/components/BrazMonkeySignalPopup";
import { TransmissionMedia } from "@/components/TransmissionMedia";

const defaultTransmissions = [
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

const archiveVideos = [
  { id: "xEF0hudLJBI", title: "WAKE UP 21 april 2018" },
  { id: "8HZ8YQgnpVw", title: "Tollie D Wrede Syfilis" },
  { id: "Xt74oL9FWqA", title: "MillenniumMiek ft Maylay Sparks - Middle Man" },
  { id: "HOMrw2qQOd8", title: "ENERGIERAMP Robotix Vol 1 October Chabliski" },
  { id: "PKpmTHKZ9pU", title: "Raymzter ft ROBOTIX (onafhankelijk) - Ambachtslieden" },
];

const navItems = ["signal", "transmissions", "telemetry", "origin", "archive", "follow", "blackbook"];

const navMaps: Record<string, { label: string; target: string }[]> = {
  signal: [
    { label: "Overview", target: "/" },
    { label: "Latest transmission", target: "/transmissions" },
    { label: "Ask Braz", target: "/telemetry" },
  ],
  transmissions: [
    { label: "Monday / quotes", target: "/transmissions" },
    { label: "Wednesday / predictions", target: "/transmissions" },
    { label: "Friday / vinyl", target: "/transmissions" },
  ],
  telemetry: [
    { label: "Signal numbers", target: "/telemetry" },
    { label: "Content gravity", target: "/telemetry" },
    { label: "Field notes", target: "/telemetry" },
  ],
  origin: [
    { label: "Origin file", target: "/origin" },
    { label: "No manual / no map", target: "/origin" },
    { label: "Pick up the signal", target: "/follow" },
  ],
  archive: [
    { label: "Browse archive", target: "/archive" },
    { label: "Video transmissions", target: "/archive" },
    { label: "Weekly drops", target: "/transmissions" },
  ],
  follow: [
    { label: "Follow the journey", target: "/follow" },
    { label: "Instagram", target: "/follow" },
    { label: "YouTube / Facebook", target: "/follow" },
  ],
  blackbook: [
    { label: "Leave a tag", target: "/blackbook" },
    { label: "Upload graffiti", target: "/blackbook" },
    { label: "Spray canvas", target: "/blackbook" },
  ],
};

const GHOULISH_URL = "https://ghoulishproductions.com/productos/alien-richer/";

const defaultSlideshowImages = [
  "/manus-storage/canonface_30853db0.jpeg",
  "/manus-storage/moondaymondaymorningquote_a499a598.jpg",
  "/manus-storage/UseAIImageJul3,2026,17_42_46_938911e9.jpeg",
  "/manus-storage/braz_monkey_no_text_338dba87.webp",
  "/manus-storage/PHOTO-2026-05-30-16-36-06_4e30a110.jpg",
];

function BackgroundSlideshow({ extraImages }: { extraImages: string[] }) {
  const [index, setIndex] = useState(0);
  const images = [...defaultSlideshowImages, ...extraImages].filter(Boolean);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % images.length), 6000);
    return () => window.clearInterval(timer);
  }, [images.length]);
  return (
    <div className="bg-slideshow" aria-hidden>
      {images.map((src, i) => (
        <img key={src} src={src} alt="" className={i === index ? "active" : ""} />
      ))}
    </div>
  );
}

const SPRAY_COLORS = [
  "#f5e642", "#ffb400", "#ff5c4d", "#ff3e8a", "#b04dff", "#6a5cff",
  "#3e8cff", "#7ec8ff", "#2ee6c8", "#3ddc54", "#a3e635", "#f0eee4",
  "#9a9a92", "#5a5a52", "#ff9de2", "#ffffff",
];

interface SprayLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
}

function createLayer(name: string, color: string, width: number, height: number): SprayLayer {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { id: crypto.randomUUID(), name, color, visible: true, canvas };
}

function SprayCanvas({ onPost, posting }: { onPost: (dataUrl: string) => void; posting: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(SPRAY_COLORS[0]);
  const [radius, setRadius] = useState(18);
  const [capSize, setCapSize] = useState(18);
  const [pressure, setPressure] = useState(50);
  const [layers, setLayers] = useState<SprayLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [redoStack, setRedoStack] = useState<HTMLCanvasElement[]>([]);

  // Initialize with one layer
  useEffect(() => {
    if (layers.length === 0) {
      const layer = createLayer("LAYER 01", color, 900, 560);
      setLayers([layer]);
      setActiveLayerId(layer.id);
    }
  }, [layers.length, color]);

  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? layers[0];

  const redraw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    layers.forEach((layer) => {
      if (layer.visible) {
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });
  };

  useEffect(() => {
    redraw();
  }, [layers, activeLayerId]);

  const spray = (x: number, y: number) => {
    if (!activeLayer) return;
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;
    const particleCount = Math.round(28 * (pressure / 50));
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * capSize;
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;
      const alpha = 0.16 * (1 - r / capSize) + 0.05;
      ctx.fillStyle = activeLayer.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, Math.random() * 2.2 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    redraw();
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
    if (!activeLayer) return;
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    redraw();
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
    // Reset to a single fresh layer
    const fresh = createLayer("LAYER 01", color, 900, 560);
    setLayers([fresh]);
    setActiveLayerId(fresh.id);
    setRedoStack([]);
  };

  const addLayer = () => {
    const layer = createLayer(`LAYER ${String(layers.length + 1).padStart(2, "0")}`, color, 900, 560);
    setLayers((prev) => [...prev, layer]);
    setActiveLayerId(layer.id);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(next[0]?.id ?? null);
      return next;
    });
  };

  const moveLayer = (id: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(idx + dir, 0, item);
      return next;
    });
  };

  const toggleLayer = (id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  const undo = () => {
    // Simple undo: clear the active layer
    if (!activeLayer) return;
    const snapshot = document.createElement("canvas");
    snapshot.width = activeLayer.canvas.width;
    snapshot.height = activeLayer.canvas.height;
    snapshot.getContext("2d")?.drawImage(activeLayer.canvas, 0, 0);
    setRedoStack((prev) => [...prev, snapshot]);
    clear();
  };

  const redo = () => {
    const snapshot = redoStack[redoStack.length - 1];
    if (!snapshot || !activeLayer) return;
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    ctx.drawImage(snapshot, 0, 0);
    setRedoStack((prev) => prev.slice(0, -1));
    redraw();
  };

  return (
    <div className="spray-book">
      <div className="spray-tools">
        {SPRAY_COLORS.map((c) => (
          <button key={c} type="button" className={`spray-color ${c === activeLayer?.color ? "active" : ""}`} style={{ background: c }} onClick={() => {
            setColor(c);
            if (activeLayer) {
              setLayers((prev) => prev.map((l) => (l.id === activeLayer.id ? { ...l, color: c } : l)));
            }
          }} aria-label={`Spray color ${c}`} />
        ))}
        <label className="spray-custom" title="Pick any color">
          <input type="color" value={activeLayer?.color ?? color} onChange={(e) => {
            setColor(e.target.value);
            if (activeLayer) {
              setLayers((prev) => prev.map((l) => (l.id === activeLayer.id ? { ...l, color: e.target.value } : l)));
            }
          }} aria-label="Custom spray color" />
          <span>ANY</span>
        </label>
        <label className="spray-size">CAP SIZE
          <input type="range" min={8} max={44} value={capSize} onChange={(e) => setCapSize(Number(e.target.value))} />
        </label>
        <label className="spray-size">PRESSURE
          <input type="range" min={10} max={100} value={pressure} onChange={(e) => setPressure(Number(e.target.value))} />
        </label>
        <button type="button" className="spray-action" onClick={undo} disabled={!activeLayer}>UNDO</button>
        <button type="button" className="spray-action" onClick={redo} disabled={redoStack.length === 0}>REDO</button>
        <button type="button" className="spray-clear" onClick={clear}>CLEAR</button>
      </div>
      <div className="spray-layers" aria-label="Spray layers">
        {layers.map((layer, idx) => (
          <div key={layer.id} className={`spray-layer ${layer.id === activeLayerId ? "active" : ""}`}>
            <button type="button" className="spray-layer-select" onClick={() => setActiveLayerId(layer.id)} aria-label={`Select ${layer.name}`}>
              <span className="spray-layer-swatch" style={{ background: layer.color }} />
              <span>{layer.name}</span>
            </button>
            <div className="spray-layer-actions">
              <button type="button" onClick={() => toggleLayer(layer.id)} aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}>{layer.visible ? "👁" : "◌"}</button>
              <button type="button" onClick={() => moveLayer(layer.id, -1)} disabled={idx === 0} aria-label="Move layer up">↑</button>
              <button type="button" onClick={() => moveLayer(layer.id, 1)} disabled={idx === layers.length - 1} aria-label="Move layer down">↓</button>
              <button type="button" onClick={() => removeLayer(layer.id)} disabled={layers.length <= 1} aria-label={`Delete ${layer.name}`}>×</button>
            </div>
          </div>
        ))}
        <button type="button" className="spray-layer-add" onClick={addLayer}>+ ADD LAYER</button>
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

function GhoulishAd() {
  const logoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!logoRef.current) return;
      const { innerWidth, innerHeight } = window;
      // Inverse parallax: move opposite to cursor, larger amplitude
      const x = (innerWidth / 2 - event.clientX) / 18;
      const y = (innerHeight / 2 - event.clientY) / 18;
      logoRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return (
    <section id="ghoulish-ad" className="ghoulish-ad" aria-label="Ghoulish advertising">
      <a ref={logoRef} href={GHOULISH_URL} target="_blank" rel="noreferrer" className="ghoulish-link">
        <img src="/manus-storage/ghoulish-logo-transparent_224a28da.png" alt="GHOULISH — www.ghoulish.com" className="ghoulish-logo" />
      </a>
      <p className="ghoulish-tag">PRESENTED BY GHOULISH</p>
    </section>
  );
}

function Hot97Player() {
  const [expanded, setExpanded] = useState(true);
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
        <button className="hot97-play" onClick={togglePlayback} aria-pressed={playing}>{playing ? "STOP FM" : "START FM"}</button>
        <p>{playing ? "FM is live. Press STOP FM to end the stream." : "Press START FM to hear HOT 97 live from New York."}</p>
        <a href="https://www.hot97.com/listen-live/" target="_blank" rel="noopener noreferrer">OPEN OFFICIAL PLAYER ↗</a>
      </div>
    </aside>
  );
}

export default function Home() {
  const { data: cms } = trpc.content.latest.useQuery(undefined, { refetchInterval: 10000 });
  const { data: cmsNavigation } = trpc.navigation.list.useQuery(undefined, { refetchInterval: 15000 });
  const { data: cmsTransmissionMedia } = trpc.transmissionMedia.list.useQuery(undefined, { refetchInterval: 15000 });
  const { data: blackbookImages } = trpc.blackbook.list.useQuery(undefined, { refetchInterval: 30000 });
  const cmsNavMaps = (cmsNavigation ?? []).reduce<Record<string, { label: string; target: string }[]>>((groups, item) => {
    (groups[item.section] ??= []).push({ label: item.label, target: item.path });
    return groups;
  }, {});
  const slideshowExtra = (blackbookImages ?? []).map((e) => e.fileUrl).filter(Boolean) as string[];
  const mediaBySlot = (cmsTransmissionMedia ?? []).reduce<Record<string, NonNullable<typeof cmsTransmissionMedia>[number]>>((latest, item) => {
    if (!latest[item.slot]) latest[item.slot] = item;
    return latest;
  }, {});
  const transmissions = (defaultTransmissions ?? []).map((item) => {
    const slot = item.day === "MONDAY" ? "monday" : item.day === "WEDNESDAY" ? "wednesday" : "friday";
    const weeklyMedia = mediaBySlot[slot];
    const syncedMedia = weeklyMedia ? { mediaUrl: weeklyMedia.fileUrl, mediaType: weeklyMedia.mediaType, mediaTitle: weeklyMedia.title, mediaCaption: weeklyMedia.caption } : {};
    if (item.day === "MONDAY" && cms?.quote) {
      return { ...item, ...syncedMedia, copy: cms.quote.body, image: cms.quote.imageUrl || item.image };
    }
    if (item.day === "WEDNESDAY" && cms?.prediction) {
      return { ...item, ...syncedMedia, copy: cms.prediction.body, image: cms.prediction.imageUrl || item.image };
    }
    if (item.day === "FRIDAY" && cms?.vinyl) {
      const v = cms.vinyl;
      return {
        ...item,
        ...syncedMedia,
        copy: `${v.title ? v.title : ""}${v.artist ? ` — ${v.artist}` : ""}${v.body ? `\n${v.body}` : ""}`.trim(),
        image: v.imageUrl || item.image,
      };
    }
    return { ...item, ...syncedMedia };
  });
  const [active, setActive] = useState("signal");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMap, setOpenMap] = useState<string | null>(null);

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
      <BackgroundSlideshow extraImages={slideshowExtra} />
      <BrazMonkeySignalPopup />
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
            <div key={id} className={`nav-map ${openMap === id ? "is-open" : ""}`}>
              <button className={active === id ? "active" : ""} onClick={() => { jump(id); setOpenMap(openMap === id ? null : id); }} aria-expanded={openMap === id} aria-haspopup="true">
                <span>0{index + 1}</span>{id}<b>+</b>
              </button>
              <div className="nav-submap" role="menu" aria-label={`${id} sub map`}>
                {(cmsNavMaps[id]?.length ? cmsNavMaps[id] : navMaps[id]).map((item) => (
                    <button key={item.label} type="button" role="menuitem" onClick={() => { window.location.href = item.target; setOpenMap(null); }}>
                    <i>↳</i>{item.label}
                  </button>
                ))}
              </div>
            </div>
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
                <TransmissionMedia
                  source={item.mediaUrl || item.image}
                  kind={item.mediaType === "video" && item.mediaUrl ? "video" : "image"}
                  poster={item.image}
                  fallback={defaultTransmissions[index].image}
                  alt={`${item.day} Braz Monkey transmission`}
                  className={`card-image card-image-${item.tone}`}
                />
                <div className="card-content"><p className="eyebrow">{item.tag}</p><h3>{item.mediaTitle || item.title}</h3><p>{item.mediaCaption || item.copy}</p><button className="text-link" onClick={() => jump("archive")}>SEE EPISODES <span>→</span></button></div>
              </article>
            ))}
          </div>
        </section>

        <section id="origin" className="section origin-section">
          <div className="origin-stamp">ORIGIN<br /><strong>UNKNOWN</strong><br />FILE 00.404</div>
          <div className="origin-copy"><p className="eyebrow">// ORIGIN FILE: UNKNOWN</p><h2>NO MANUAL.<br /><em>NO MAP.</em></h2><p>Somewhere between a galaxy that does not exist on any map and a planet that is still figuring out WiFi, Braz Monkey landed. No spaceship. No manual. No idea what a Monday is.</p><p>Every week he transmits what he finds—quotes that hit different, predictions from another dimension, and vinyl records that might hold the key to who he actually is.</p><button className="button button-primary" onClick={() => jump("follow")}>PICK UP THE SIGNAL <span>↗</span></button></div>
          <div className="origin-number">02<span>/</span>05</div>
        </section>

        <SignalAnalytics />

        <section id="archive" className="section archive-section">
          <div className="section-heading"><div><p className="eyebrow">// SIGNAL ARCHIVE</p><h2>THE<br /><em>ARCHIVE</em></h2></div><p className="section-note">A record of everything Braz<br />has intercepted so far.</p></div>
          <div className="archive-panel"><div className="archive-ring archive-photo" style={{ backgroundImage: "url('/manus-storage/PHOTO-2026-05-30-16-36-06_4e30a110.jpg')" }}><span>TRANSMISSION<br />ARCHIVE</span></div><div><p className="archive-code">ARCHIVE STATUS: RECEIVING</p><h3>THE SIGNAL<br /><em>NEVER STOPS.</em></h3><p>Browse the transmissions as they land. Visual fragments, late-night observations, and clues from the long way home.</p></div><button className="button button-ghost" onClick={() => jump("transmissions")}>BROWSE SIGNALS <span>→</span></button></div>
          <div className="archive-strip" role="region" aria-label="Scrollable video archive">
            {archiveVideos.map((video, index) => (
              <figure key={video.id} className="archive-item">
                <div className="archive-frame">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
                <figcaption><span className="archive-index">{String(index + 1).padStart(2, "0")}</span>{video.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="follow" className="section follow-section">
          <div className="follow-art" style={{ backgroundImage: "url('/manus-storage/follow-silhouette-vignette_f7d1dd0e.png')" }} />
          <div className="follow-copy"><p className="eyebrow">// PICK UP THE SIGNAL</p><h2>FOLLOW THE<br /><em>JOURNEY</em></h2><p>Three transmissions a week. Every week. Braz is still figuring out this planet—follow along so you do not miss a signal.</p><div className="social-links"><a href="https://www.facebook.com/BRAZM0NKEY/" target="_blank" rel="noreferrer">FACEBOOK <span>↗</span></a><a href="https://www.youtube.com/@13VIERENTWINTIG" target="_blank" rel="noreferrer">YOUTUBE <span>↗</span></a><a href="https://www.instagram.com/brazm0nkey/" target="_blank" rel="noreferrer">INSTAGRAM <span>↗</span></a></div></div>
        </section>

        <section id="blackbook" className="section blackbook-section">
          <div className="section-heading"><div><p className="eyebrow">// BLACKBOOK</p><h2>LEAVE YOUR<br /><em>TAG</em></h2></div><p className="section-note">A personal sketchbook for graffiti writers to practice lettering, test color schemes, and develop new design concepts before painting them on public or legal surfaces.</p></div>
          <div className="blackbook-panel">
            <div className="blackbook-copy"><p className="eyebrow">// BLACKBOOK</p><p>Leave your tag or upload your graffiti of Braz Monkey. This is a personal sketchbook for practice, color tests, and new concepts.</p></div>
            <div className="blackbook-actions">
              <button className="button button-primary" onClick={() => setBlackbookOpen(!blackbookOpen)}>LEAVE A TAG <span>↗</span></button>
              <button className="button button-ghost" onClick={() => fileInputRef.current?.click()}>UPLOAD GRAFFITI <span>→</span></button>
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
        <GhoulishAd />
      </main>

      {lightbox && <BlackbookLightbox url={lightbox.url} tag={lightbox.tag} onClose={() => setLightbox(null)} />}

      <footer className="site-footer">
        <div className="footer-brand"><img src="/manus-storage/braz-monkey-banner_8e9fcbe1.png" alt="BRAZ MONKEY" /><span>BRAZ MONKEY</span></div>
        <p>Still figuring out this planet. Follow along.</p>
        <button type="button" className="footer-disclaimer-toggle" onClick={() => {
          const next = !disclaimerOpen;
          setDisclaimerOpen(next);
          if (next) {
            requestAnimationFrame(() => {
              document.querySelector(".footer-disclaimer-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
          }
        }} aria-expanded={disclaimerOpen}>{disclaimerOpen ? "HIDE DISCLAIMER" : "DISCLAIMER"} <span>{disclaimerOpen ? "−" : "?"}</span></button>
        <span>© 2026 BRAZ MONKEY UNIVERSE</span>
      </footer>
      <div className={`footer-disclaimer-panel ${disclaimerOpen ? "is-open" : ""}`} aria-hidden={!disclaimerOpen}>
        <div className="disclaimer-content">
          <h4>Disclaimer</h4>
          <p><strong>1. Promotional and Informational Use Only</strong><br />All content, information, and materials provided on this website are for promotional and general informational purposes only. The information is not intended to be, and should not be taken as, professional, legal, financial, or medical advice.</p>
          <p><strong>2. No Warranties (Use at Your Own Risk)</strong><br />While I try to provide accurate information, I make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of the information contained on this website. Any reliance you place on such information is strictly at your own risk.</p>
          <p><strong>3. Limitation of Liability</strong><br />In no event will I be held liable for any loss or damage, including without limitation, indirect or consequential loss or damage, arising from or in connection with the use of this website. You are solely responsible for any actions you take based on the information provided on this website.</p>
          <p><strong>4. External Links</strong><br />Through this website, you may be able to link to other websites which are not under my control. I have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.</p>
        </div>
      </div>
      <BrazMonkeyChat />
    </div>
  );
}
