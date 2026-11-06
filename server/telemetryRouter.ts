import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import { z } from "zod";
import { TELEMETRY_KINDS, TELEMETRY_PAGES, TELEMETRY_SOURCES } from "../shared/telemetry";
import { publicProcedure, router } from "./_core/trpc";
import { hasValidAdminSession } from "./adminSession";
import { getTelemetrySummary, incrementTelemetry } from "./telemetryDb";
import { telemetryRateLimiter } from "./telemetryRateLimit";

const ALLOWED_ORIGINS = new Set([
  "https://braz-monkey.com",
  "https://www.braz-monkey.com",
  "https://brazmonkey-aocqyulm.manus.space",
]);
// Best-effort known crawler/automation exclusion, not a claim of human verification.
const BOT_UA = /bot|crawler|spider|slurp|headless|phantom|selenium|playwright|puppeteer|lighthouse|pagespeed|curl\b|wget\b|python-requests|python-urllib|httpclient|go-http-client|uptime|monitor|facebookexternalhit|facebookcatalog|googleother|bingpreview|preview|scanner|scrapy|axios|node-fetch|vercel\/|\bai2\b/i;
const recordInput = z.object({
  kind: z.enum(TELEMETRY_KINDS),
  page: z.enum(TELEMETRY_PAGES),
  source: z.enum(TELEMETRY_SOURCES),
}).strict();
const summaryInput = z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }).strict();

function header(req: Pick<Request, "headers">, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === "string" ? value : undefined;
}

function telemetryUnavailable(): TRPCError {
  // Do not expose SQL, connection information, raw requests, or underlying errors.
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Telemetry is unavailable. Try again later." });
}

export const telemetryRouter = router({
  record: publicProcedure.input(recordInput).mutation(async ({ input, ctx }) => {
    const origin = header(ctx.req, "origin");
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Telemetry requires an approved same-site origin." });
    }
    const ua = header(ctx.req, "user-agent");
    if (header(ctx.req, "dnt")?.trim() === "1" || header(ctx.req, "sec-gpc")?.trim() === "1" || !ua || BOT_UA.test(ua)) {
      return { recorded: false };
    }
    if (await hasValidAdminSession(ctx.req)) return { recorded: false };

    const now = Date.now();
    // Express req.ip respects the existing server trust-proxy policy; don't trust arbitrary XFF.
    const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
    if (!telemetryRateLimiter.allow(ip, now)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many telemetry requests." });
    }
    try {
      await incrementTelemetry(input, now);
    } catch {
      throw telemetryUnavailable();
    }
    return { recorded: true };
  }),
  summary: publicProcedure.input(summaryInput).query(async ({ input, ctx }) => {
    // CMS is independent of Manus OAuth; a Manus admin role does not grant access.
    if (!(await hasValidAdminSession(ctx.req))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session expired. Log opnieuw in." });
    }
    ctx.res.setHeader("Cache-Control", "private, no-store");
    try {
      return await getTelemetrySummary(input.days, Date.now());
    } catch {
      throw telemetryUnavailable();
    }
  }),
});
