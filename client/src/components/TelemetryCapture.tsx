import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { pageCategory, referrerCategory, shouldCapture } from "@/lib/telemetryCapture";

export function TelemetryCapture() {
  const record = trpc.telemetry.record.useMutation({ retry: false });
  const sent = useRef(false);
  const mutate = useRef(record.mutate);
  mutate.current = record.mutate;
  useEffect(() => {
    const privacy = { dnt: navigator.doNotTrack, gpc: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl };
    const path = window.location.pathname;
    const page = pageCategory(path);
    if (!page || !shouldCapture(window.location.hostname, path, privacy)) return;
    const source = referrerCategory(document.referrer);
    if (!sent.current) {
      sent.current = true;
      mutate.current({ kind: "pageview", page, source });
    }
    let lastClick = 0;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      if (!event.target.closest('a[data-store-link="true"]')) return;
      if (!shouldCapture(window.location.hostname, path, { dnt: navigator.doNotTrack, gpc: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl })) return;
      // Prevent rapid double-counts. Do not block or delay the normal link.
      if (Date.now() - lastClick < 1000) return;
      lastClick = Date.now();
      mutate.current({ kind: "store_click", page, source });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
