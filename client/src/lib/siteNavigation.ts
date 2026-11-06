export const STORE_URL = "https://shop.braz-monkey.com/";
export const PUBLIC_NAV_ITEMS = ["signal", "transmissions", "origin", "archive", "follow", "store", "blackbook"] as const;
export const PAGE_LINKS = [
  ["TRANSMISSIONS", "/transmissions"], ["ORIGIN", "/origin"],
  ["ARCHIVE", "/archive"], ["FOLLOW", "/follow"],
  ["SHOP", STORE_URL], ["BLACKBOOK", "/blackbook"],
] as const;

/** Hide old CMS telemetry links without deleting or changing stored navigation. */
export function isPublicNavTarget(target: string) {
  try {
    const url = new URL(target, "https://braz-monkey.com");
    const own = ["braz-monkey.com", "www.braz-monkey.com", "brazmonkey-aocqyulm.manus.space"].includes(url.hostname);
    return !own || (!/^\/(telemetry|admin)(\/|$)/.test(url.pathname) && url.hash.toLowerCase() !== "#telemetry");
  } catch { return false; }
}
