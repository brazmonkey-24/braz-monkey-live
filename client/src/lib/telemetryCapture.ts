export type TelemetryPage = "home" | "transmissions" | "origin" | "archive" | "follow" | "blackbook" | "post";
export type TelemetrySource = "direct" | "internal" | "search" | "social" | "other";
const publicHosts = ["braz-monkey.com", "www.braz-monkey.com", "brazmonkey-aocqyulm.manus.space"];
export function pageCategory(pathname: string): TelemetryPage | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (/^\/archive\/post\/\d+$/.test(path)) return "post";
  const page = path.slice(1);
  return ["transmissions", "origin", "archive", "follow", "blackbook"].includes(page) ? page as TelemetryPage : null;
}
export function referrerCategory(referrer: string): TelemetrySource {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (publicHosts.includes(host) || ["store.braz-monkey.com", "shop.braz-monkey.com"].includes(host)) return "internal";
    if (/(^|\.)(google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})|bing\.com|duckduckgo\.com|yahoo\.com)$/.test(host)) return "search";
    if (/(^|\.)(instagram\.com|facebook\.com|youtube\.com|youtu\.be|t\.co|x\.com|tiktok\.com)$/.test(host)) return "social";
    return "other";
  } catch { return "other"; }
}
export function shouldCapture(host: string, pathname: string, privacy: { dnt?: string | null; gpc?: boolean }) {
  return publicHosts.includes(host.toLowerCase()) && pageCategory(pathname) !== null && privacy.dnt !== "1" && !privacy.gpc;
}
