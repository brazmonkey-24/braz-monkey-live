import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { previewServerOptions } from "./hmrOptions";

describe("secure reverse-proxy HMR", () => {
  it("uses the attached Express server, wss and public 443 rather than localhost:5173", () => {
    const server = createServer();
    const config = previewServerOptions(server);
    expect(config.middlewareMode).toBe(true);
    expect(config.hmr).toEqual({ server, protocol: "wss", clientPort: 443, path: "/__vite_hmr" });
    expect(config.hmr).not.toHaveProperty("host");
  });
  it("preserves allowed hosts and sensitive-file protections", () => {
    const base = { allowedHosts: [".manus.computer", "localhost"], fs: { strict: true, deny: ["**/.*"] } };
    const config = previewServerOptions(createServer(), base);
    expect(config.allowedHosts).toEqual(base.allowedHosts);
    expect(config.allowedHosts).not.toBe(true);
    expect(config.fs).toEqual(base.fs);
  });
});
