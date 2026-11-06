import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NAV_BRAND_LOGO } from "../client/src/lib/siteBrand";

describe("supplied corner logo", () => {
  it("uses the managed transparent version of the uploaded BRAZlogo2", () => {
    expect(NAV_BRAND_LOGO).toBe("/manus-storage/braz-nav-logo2-transparent_c0e91137.png");
    expect(NAV_BRAND_LOGO).not.toMatch(/public|upload/);
  });
  it("shares the new logo across homepage and public subpage headers", () => {
    const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
    const subpage = readFileSync(new URL("../client/src/pages/SignalPages.tsx", import.meta.url), "utf8");
    expect(home).toContain('className="brand-mark brand-banner"><img src={NAV_BRAND_LOGO} alt="BRAZ MONKEY"');
    expect(subpage).toContain('aria-label="Back to Braz Monkey home"><img src={NAV_BRAND_LOGO}');
    expect(home).toContain('data-text={"BRAZ\\nMONKEY"}');
    expect(home).toContain('/manus-storage/braz-monkey-banner_8e9fcbe1.png');
  });
});
