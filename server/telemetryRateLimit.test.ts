import { describe, expect, it } from "vitest";
import { TelemetryRateLimiter } from "./telemetryRateLimit";

describe("telemetry ephemeral rate limiter", () => {
  it("allows up to the per-IP quota, blocks excess and resets on expiry", () => {
    const limiter = new TelemetryRateLimiter(2, 60_000, 10);
    expect(limiter.allow("192.0.2.1", 100_000)).toBe(true);
    expect(limiter.allow("192.0.2.1", 100_001)).toBe(true);
    expect(limiter.allow("192.0.2.1", 100_002)).toBe(false);
    expect(limiter.allow("192.0.2.2", 100_002)).toBe(true);
    expect(limiter.allow("192.0.2.1", 160_000)).toBe(true);
  });
  it("fails closed at its key cap and releases expired keys", () => {
    const limiter = new TelemetryRateLimiter(2, 60_000, 2);
    expect(limiter.allow("192.0.2.1", 100_000)).toBe(true);
    expect(limiter.allow("192.0.2.2", 100_001)).toBe(true);
    expect(limiter.allow("192.0.2.3", 100_002)).toBe(false);
    expect(limiter.allow("192.0.2.1", 100_003)).toBe(true);
    expect(limiter.allow("192.0.2.3", 160_001)).toBe(true);
  });
});
