import { useEffect, useRef } from "react";

const CURSOR_ASSET = "/manus-storage/braz-monkey-cursor-64-alpha_69db966a.png";

export default function CursorFollower() {
  const cursorRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      const interactive = Boolean(target?.closest("a, button, input, select, textarea, [role=button]"));
      const closeTarget = Boolean(target?.closest(".bm-signal-popup-close"));
      const lastX = Number(cursor.dataset.x || event.clientX);
      const lastY = Number(cursor.dataset.y || event.clientY);
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      const motionScale = Math.min(1.65, 0.82 + distance / 70);
      const scale = closeTarget ? 2.8 : interactive ? 1.75 : motionScale;

      cursor.dataset.x = String(event.clientX);
      cursor.dataset.y = String(event.clientY);
      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(${scale})`;
    };

    const handlePress = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 8}px, 0) scale(1.2)`;
    };

    const handleVisibility = () => {
      cursor.style.opacity = "1";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handlePress, { passive: true });
    window.addEventListener("mouseenter", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handlePress);
      window.removeEventListener("mouseenter", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <img ref={cursorRef} className="cursor-follower" src={CURSOR_ASSET} alt="" aria-hidden="true" />;
}
