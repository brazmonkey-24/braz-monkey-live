import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const SIGNAL_VIDEO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663925695575/noWMkiWCybrGXXey.mp4";

export function BrazMonkeySignalPopup() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Intentionally reset on each mount so a normal visit or browser refresh opens the signal again.
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    const attempt = videoRef.current.play();
    if (attempt) attempt.catch(() => undefined);
  }, [open]);

  const close = () => {
    videoRef.current?.pause();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="bm-signal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <div className="bm-signal-popup" role="dialog" aria-modal="true" aria-label="Braz Monkey signal video">
        <div className="bm-signal-popup-label">// SIGNAL INTERCEPTED</div>
        <button className="bm-signal-popup-close" type="button" onClick={close} aria-label="Close signal video"><X size={15} /></button>
        <video ref={videoRef} autoPlay muted loop playsInline controls preload="metadata" aria-label="Braz Monkey signal transmission">
          <source src={SIGNAL_VIDEO} type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>
      </div>
    </div>
  );
}
