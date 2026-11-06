import type { Server } from "node:http";
import type { ServerOptions } from "vite";

/** Manus preview terminates TLS on 443 and forwards upgrades to Express on 3000. */
export function previewServerOptions(server: Server, base: ServerOptions = {}): ServerOptions {
  return {
    ...base,
    middlewareMode: true,
    hmr: { server, protocol: "wss", clientPort: 443, path: "/__vite_hmr" },
  };
}
