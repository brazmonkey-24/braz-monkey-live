// Ephemeral anti-abuse state only: never write IPs to the database or logs.
export class TelemetryRateLimiter {
  private readonly entries = new Map<string, { expiresAt: number; count: number }>();
  private lastSweepAt = 0;

  constructor(
    private readonly maxRequests = 120,
    private readonly windowMs = 60_000,
    private readonly maxKeys = 5_000,
  ) {}

  allow(ip: string, now: number): boolean {
    if (now - this.lastSweepAt >= this.windowMs) {
      this.entries.forEach((entry, key) => {
        if (entry.expiresAt <= now) this.entries.delete(key);
      });
      this.lastSweepAt = now;
    }
    const entry = this.entries.get(ip);
    if (entry && entry.expiresAt > now) {
      if (entry.count >= this.maxRequests) return false;
      entry.count += 1;
      return true;
    }
    if (!entry && this.entries.size >= this.maxKeys) return false;
    this.entries.set(ip, { expiresAt: now + this.windowMs, count: 1 });
    return true;
  }
}

export const telemetryRateLimiter = new TelemetryRateLimiter();
