import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import type { TrpcContext } from "./_core/context";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "./adminSession";
import { telemetryRouter } from "./telemetryRouter";
import { incrementTelemetry, getTelemetrySummary } from "./telemetryDb";
import { telemetryRateLimiter } from "./telemetryRateLimit";

vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "telemetry-test-secret-not-production" } }));
vi.mock("./telemetryDb", () => ({ incrementTelemetry: vi.fn(), getTelemetrySummary: vi.fn() }));
vi.mock("./telemetryRateLimit", () => ({ telemetryRateLimiter: { allow: vi.fn() } }));
const record = { kind: "pageview", page: "home", source: "direct" } as const;
const NOW = Date.UTC(2026, 10, 6, 21, 2, 31);
const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36";
function context(headers: Record<string, string | string[] | undefined> = {}, user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { headers: { origin: "https://www.braz-monkey.com", "user-agent": ua, ...headers }, ip: "192.0.2.10", socket: { remoteAddress: "192.0.2.20" } } as TrpcContext["req"],
    res: { setHeader: vi.fn(), cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}
async function cmsHeaders() {
  return { cookie: `${ADMIN_SESSION_COOKIE}=${await createAdminSessionToken()}` };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  vi.mocked(incrementTelemetry).mockResolvedValue(undefined);
  vi.mocked(telemetryRateLimiter.allow).mockReturnValue(true);
  vi.mocked(getTelemetrySummary).mockResolvedValue({ updatedAt: NOW, startedAt: null, pageViews: 0, storeClicks: 0, recentViews: 0, daily: [], pages: [], sources: [], feed: [] });
});
afterEach(() => vi.useRealTimers());

describe("telemetry record validation and origin", () => {
  it.each(["https://braz-monkey.com", "https://www.braz-monkey.com", "https://brazmonkey-aocqyulm.manus.space"])("accepts only an exact approved origin: %s", async origin => {
    expect(await telemetryRouter.createCaller(context({ origin })).record(record)).toEqual({ recorded: true });
    expect(incrementTelemetry).toHaveBeenCalledWith(record, NOW);
  });
  it.each([undefined, "null", "http://www.braz-monkey.com", "https://evil.example", "https://www.braz-monkey.com.evil.example", "https://www.braz-monkey.com/", "https://www.braz-monkey.com:443", "https://www.braz-monkey.com,https://evil.example", ["https://www.braz-monkey.com"]])("rejects missing, malformed, spoofed or nonexact origin %s", async origin => {
    await expect(telemetryRouter.createCaller(context({ origin, referer: "https://www.braz-monkey.com/" })).record(record)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(incrementTelemetry).not.toHaveBeenCalled();
  });
  it.each([
    { ...record, page: "home'; DROP TABLE users; --" },
    { ...record, page: "admin" }, { ...record, page: "/post/12?email=person@example.com" },
    { ...record, kind: "session" }, { ...record, source: "https://google.com?q=private" },
    { ...record, timestamp: 1 }, { ...record, ip: "192.0.2.99" },
    { ...record, referrer: "https://private.example/?secret=x" }, { ...record, userAgent: "private" },
    { ...record, sessionId: "private" }, { ...record, userId: "private" },
    { ...record, query: "private" }, { ...record, count: 999 },
  ])("rejects injection, unknown enums and all extra personal/timestamp/counter fields", async input => {
    await expect(telemetryRouter.createCaller(context()).record(input as typeof record)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(incrementTelemetry).not.toHaveBeenCalled();
  });
  it("passes only the three allowed dimensions and server time to the database", async () => {
    const ctx = context({ referer: "https://private.example/?email=private", "x-forwarded-for": "203.0.113.50", cookie: "unrelated_session=private" });
    const input = { kind: "store_click", page: "archive", source: "search" } as const;
    await telemetryRouter.createCaller(ctx).record(input);
    expect(incrementTelemetry).toHaveBeenCalledTimes(1);
    expect(incrementTelemetry).toHaveBeenCalledWith(input, NOW);
    expect(telemetryRateLimiter.allow).toHaveBeenCalledWith("192.0.2.10", NOW);
    expect(ctx.res.cookie).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(incrementTelemetry).mock.calls)).not.toMatch(/private|192\.0|203\.0/);
  });
});

describe("telemetry exclusions and errors", () => {
  it.each([{ dnt: "1" }, { "sec-gpc": "1" }, { dnt: " 1 " }])("does not persist privacy opt-outs %s", async headers => {
    expect(await telemetryRouter.createCaller(context(headers)).record(record)).toEqual({ recorded: false });
    expect(incrementTelemetry).not.toHaveBeenCalled();
    expect(telemetryRateLimiter.allow).not.toHaveBeenCalled();
  });
  it.each([undefined, "", "Googlebot/2.1", "facebookexternalhit/1.1", "HeadlessChrome/130", "curl/8.0", "python-requests/2", "GPTBot/1", "BingPreview/1", "UptimeRobot/1"])("excludes empty UA and known automation %s", async agent => {
    expect(await telemetryRouter.createCaller(context({ "user-agent": agent })).record(record)).toEqual({ recorded: false });
    expect(incrementTelemetry).not.toHaveBeenCalled();
  });
  it("excludes authenticated CMS activity even on a public page", async () => {
    expect(await telemetryRouter.createCaller(context(await cmsHeaders())).record(record)).toEqual({ recorded: false });
    expect(incrementTelemetry).not.toHaveBeenCalled();
    expect(telemetryRateLimiter.allow).not.toHaveBeenCalled();
  });
  it("does not trust a forged CMS cookie to bypass the limiter", async () => {
    vi.mocked(telemetryRateLimiter.allow).mockReturnValue(false);
    await expect(telemetryRouter.createCaller(context({ cookie: `${ADMIN_SESSION_COOKIE}=forged` })).record(record)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(incrementTelemetry).not.toHaveBeenCalled();
  });
  it("surfaces write/database failures without returning false success or leaking detail", async () => {
    vi.mocked(incrementTelemetry).mockRejectedValue(new Error("SQL database-password=private"));
    await expect(telemetryRouter.createCaller(context()).record(record)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Telemetry is unavailable. Try again later." });
  });
});

describe("telemetry CMS-only summary", () => {
  it.each([7, 30, 90] as const)("accepts %s days with a real CMS token and no Manus OAuth user", async days => {
    const ctx = context(await cmsHeaders());
    expect(await telemetryRouter.createCaller(ctx).summary({ days })).toMatchObject({ startedAt: null, pageViews: 0 });
    expect(getTelemetrySummary).toHaveBeenCalledWith(days, NOW);
    expect(ctx.res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });
  it("blocks anonymous and Manus OAuth admins without the CMS cookie", async () => {
    for (const user of [null, { role: "admin", id: 123, openId: "oauth-admin" } as TrpcContext["user"]]) {
      await expect(telemetryRouter.createCaller(context({}, user)).summary({ days: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    expect(getTelemetrySummary).not.toHaveBeenCalled();
  });
  it("blocks forged, wrong-scope and expired CMS cookies", async () => {
    const key = new TextEncoder().encode("telemetry-test-secret-not-production");
    const wrongScope = await new SignJWT({ scope: "not-admin" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(key);
    const expired = await new SignJWT({ scope: "braz-admin" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(Math.floor(NOW / 1000) - 1).sign(key);
    for (const token of ["forged", wrongScope, expired]) {
      await expect(telemetryRouter.createCaller(context({ cookie: `${ADMIN_SESSION_COOKIE}=${token}` })).summary({ days: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    expect(getTelemetrySummary).not.toHaveBeenCalled();
  });
  it.each([{ days: 0 }, { days: 91 }, { days: 365 }, { days: "7" }, { days: 7, start: 0 }, { days: 7, source: "';DROP TABLE users" }])("rejects unbounded/invalid query input", async input => {
    await expect(telemetryRouter.createCaller(context(await cmsHeaders())).summary(input as { days: 7 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(getTelemetrySummary).not.toHaveBeenCalled();
  });
  it("surfaces read failure instead of fabricated zero history", async () => {
    vi.mocked(getTelemetrySummary).mockRejectedValue(new Error("SQL private query detail"));
    await expect(telemetryRouter.createCaller(context(await cmsHeaders())).summary({ days: 7 })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Telemetry is unavailable. Try again later." });
  });
});
