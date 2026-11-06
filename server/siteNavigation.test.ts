import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PUBLIC_NAV_ITEMS, PAGE_LINKS, STORE_URL, isPublicNavTarget } from "../client/src/lib/siteNavigation";
import { pageCategory, referrerCategory, shouldCapture } from "../client/src/lib/telemetryCapture";
import { DISCLAIMER_TITLE, DISCLAIMER_PARAGRAPHS } from "../client/src/components/FooterDisclaimer";

describe("public navigation and footer", () => {
  it("puts SHOP immediately before BLACKBOOK, never telemetry", () => {
    expect(PUBLIC_NAV_ITEMS).not.toContain("telemetry");
    expect(PUBLIC_NAV_ITEMS.indexOf("store") + 1).toBe(PUBLIC_NAV_ITEMS.indexOf("blackbook"));
    const labels = PAGE_LINKS.map(([label]) => label);
    expect(labels.indexOf("SHOP") + 1).toBe(labels.indexOf("BLACKBOOK"));
    expect(labels).not.toContain("STORE");
    expect(PAGE_LINKS.find(([label]) => label === "SHOP")?.[1]).toBe("https://shop.braz-monkey.com/");
    expect(STORE_URL).not.toContain("admin.shopify");
  });
  it("hides telemetry/admin links from public CMS submaps without deleting records", () => {
    for (const url of ["/telemetry", "/telemetry/", "/admin?workspace=telemetry", "https://www.braz-monkey.com/telemetry", "/#telemetry"]) expect(isPublicNavTarget(url)).toBe(false);
    expect(isPublicNavTarget("https://www.hot97.com/listen-live/")).toBe(true);
    expect(isPublicNavTarget("/transmissions")).toBe(true);
  });
  it("keeps SHOP as normal same-tab anchor and telemetry only in CMS", () => {
    const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
    expect(home).toContain('href={STORE_URL}');
    expect(home).toContain('data-store-link="true"');
    expect(home).toContain('</span>SHOP</a>');
    expect(home).not.toContain('</span>STORE</a>');
    expect(home).not.toContain("<SignalAnalytics");
    const admin = readFileSync(new URL("../client/src/pages/Admin.tsx", import.meta.url), "utf8");
    expect(admin).toContain('workspace === "telemetry" && <SignalAnalytics />');
    expect(admin).toContain('if (!session.data?.ok)');
    const main = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
    expect(main).toContain('operation.path === "telemetry.record"');
    expect(main).toContain('keepalive: true');
  });
  it("preserves the supplied Portuguese disclaimer, excluding editing prompt", () => {
    expect(DISCLAIMER_TITLE).toBe("⚠️ OLHA AQUI, MEU PARÇA: O PAPO RETO DO MACACO");
    expect(DISCLAIMER_PARAGRAPHS[2]).toBe("Usa por sua conta e risco, malandro! 🐒🍌");
    expect(DISCLAIMER_PARAGRAPHS.join(" ")).not.toContain("Quer que eu adapte");
  });
});
describe("privacy-minimal public capture", () => {
  it("excludes CMS, unknown pages and preview hosts", () => {
    expect(pageCategory("/admin")).toBeNull();
    expect(pageCategory("/telemetry")).toBeNull();
    expect(pageCategory("/media")).toBeNull();
    expect(pageCategory("/archive/post/123/")).toBe("post");
    expect(shouldCapture("3000-example.manus.computer", "/", {})).toBe(false);
    expect(shouldCapture("braz-monkey.com", "/", {})).toBe(true);
  });
  it("honors both DNT and GPC", () => {
    expect(shouldCapture("braz-monkey.com", "/", { dnt: "1" })).toBe(false);
    expect(shouldCapture("braz-monkey.com", "/", { gpc: true })).toBe(false);
  });
  it("reduces referrers to coarse categories, never paths or querystrings", () => {
    expect(referrerCategory("https://www.google.com/search?q=private+text")).toBe("search");
    expect(referrerCategory("https://www.instagram.com/person/private?token=secret")).toBe("social");
    expect(referrerCategory("https://store.braz-monkey.com/customer/123")).toBe("internal");
    expect(referrerCategory("https://google.com.attacker.test/private")).toBe("other");
    expect(referrerCategory("")).toBe("direct");
  });
});
