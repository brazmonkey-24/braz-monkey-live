import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("original homepage BRAZ MONKEY glitch", () => {
  it("aligns the overlay text with the visible explicit two-line heading", () => {
    expect(home).toContain('data-text={"BRAZ\\nMONKEY"}');
    expect(home).toContain('aria-label="BRAZ MONKEY">BRAZ<br /><em>MONKEY</em></h1>');
    expect(home).not.toContain('className="glitch-title" data-text="BRAZ MONKEY"');
    const layers = css.match(/\.glitch-title::before,\.glitch-title::after\s*\{([^}]+)\}/)?.[1];
    expect(layers).toContain("content:attr(data-text)");
    expect(layers).toContain("white-space:pre-line");
    expect(layers).toContain("pointer-events:none");
  });

  it("retains the original pink and white stepped clip-path animation", () => {
    expect(css).toContain("color:var(--pink); transform:translate(-2px,0)");
    expect(css).toContain("color:var(--paper); transform:translate(2px,0)");
    expect(css).toContain("animation:glitch-clip 2.4s steps(2,end) infinite;");
    expect(css).toContain("animation:glitch-clip 2.4s steps(2,end) infinite reverse;");
    expect(css).toContain("@keyframes glitch-clip");
    expect(home).toContain('</span>SHOP</a>');
    expect(home).toContain('<TransmissionMedia');
  });

  it("respects reduced-motion preferences without disabling normal glitch styling", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce) { .hero-glitch,.glitch-title::before,.glitch-title::after { animation:none; } }");
  });
});
