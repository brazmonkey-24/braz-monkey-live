import { beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { cmsTelemetryCounts } from "../drizzle/schema";
import { getDb } from "./db";
import { getTelemetrySummary, incrementTelemetry, telemetryMinute, telemetryWindowStart, TELEMETRY_DAY_MS } from "./telemetryDb";

vi.mock("./db", () => ({ getDb: vi.fn() }));
const NOW = Date.UTC(2026, 10, 6, 21, 2, 31);
const MINUTE = telemetryMinute(NOW);
const TODAY = Date.UTC(2026, 10, 6);
const INPUT = { kind: "pageview", page: "home", source: "direct" } as const;
// Fake MySQL driver. Drizzle still builds real SQL/params, but no network/DB calls occur.
function fakeDatabase() {
  const query = vi.fn();
  const client = { query } as unknown as Parameters<typeof drizzle>[0];
  const db = drizzle(client);
  vi.mocked(getDb).mockResolvedValue(db as Awaited<ReturnType<typeof getDb>>);
  return { db, query };
}
beforeEach(() => vi.clearAllMocks());

describe("telemetry persistence", () => {
  it("schema stores only the aggregate dimensions and counter with a compound primary key", () => {
    const config = getTableConfig(cmsTelemetryCounts);
    expect(config.name).toBe("cms_telemetry_counts");
    expect(config.columns.map(column => column.name)).toEqual(["minuteBucket", "kind", "page", "source", "count"]);
    expect(config.primaryKeys[0].columns.map(column => column.name)).toEqual(["minuteBucket", "kind", "page", "source"]);
    expect(config.columns.find(column => column.name === "minuteBucket")?.getSQLType()).toBe("bigint unsigned");
  });
  it("uses server UTC minute flooring and selected UTC calendar boundaries", () => {
    expect(telemetryMinute(NOW)).toBe(Date.UTC(2026, 10, 6, 21, 2));
    expect(telemetryWindowStart(7, NOW)).toBe(Date.UTC(2026, 9, 31));
    expect(telemetryWindowStart(90, NOW)).toBe(TODAY - 89 * TELEMETRY_DAY_MS);
  });
  it("builds one atomic upsert, incrementing the counter without a read-then-write race", async () => {
    const { query } = fakeDatabase();
    let count = 0;
    query.mockImplementation(async () => { count += 1; return [{ insertId: 0, affectedRows: 1 }, []]; });
    await Promise.all(Array.from({ length: 12 }, () => incrementTelemetry(INPUT, NOW)));
    expect(count).toBe(12);
    for (const [options, params] of query.mock.calls) {
      expect(options.sql).toMatch(/^insert into `cms_telemetry_counts`/);
      expect(options.sql).toContain("on duplicate key update `count` = `cms_telemetry_counts`.`count` + 1");
      expect(params).toEqual([MINUTE, "pageview", "home", "direct", 1]);
      expect(options.sql).not.toMatch(/ip|referrer|userAgent|sessionId|userId|select /i);
    }
  });
  it("throws on absent DB instead of silently accepting events or returning fake summaries", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(incrementTelemetry(INPUT, NOW)).rejects.toThrow("Telemetry database unavailable");
    await expect(getTelemetrySummary(7, NOW)).rejects.toThrow("Telemetry database unavailable");
  });
  it("propagates write/SQL errors without fallback data", async () => {
    const { query } = fakeDatabase();
    query.mockRejectedValue(new Error("database connection lost"));
    await expect(incrementTelemetry(INPUT, NOW)).rejects.toMatchObject({ cause: { message: "database connection lost" } });
    await expect(getTelemetrySummary(7, NOW)).rejects.toMatchObject({ cause: { message: "database connection lost" } });
  });
});

describe("telemetry aggregate summary", () => {
  it.each([7, 30, 90] as const)("returns a legitimate empty %s-day state, never synthetic events", async days => {
    const { query } = fakeDatabase();
    query.mockResolvedValue([[], []]);
    const summary = await getTelemetrySummary(days, NOW);
    expect(summary).toMatchObject({ updatedAt: NOW, startedAt: null, pageViews: 0, storeClicks: 0, recentViews: 0, pages: [], sources: [], feed: [] });
    expect(summary.daily).toHaveLength(days);
    expect(summary.daily.every(day => day.views === 0 && day.storeClicks === 0)).toBe(true);
    expect(summary.daily[days - 1].day).toBe("2026-11-06");
    expect(query).toHaveBeenCalledTimes(5);
    // Every query is bounded: only the indexed start LIMIT 1 is outside the chosen window.
    for (const [options, params] of query.mock.calls.slice(1)) {
      expect(options.sql).toMatch(/where .*`minuteBucket` >= \? and .*`minuteBucket` <= \?/);
      expect(options.sql).toMatch(/limit \?$/);
      expect(params).toContain(telemetryWindowStart(days, NOW));
      expect(params).toContain(MINUTE);
    }
  });
  it("combines database aggregates, preserves coarse source/page totals and zero-fills only dates", async () => {
    const { query } = fakeDatabase();
    query.mockImplementation(async (options: { sql: string }) => {
      if (options.sql.includes("group by floor(")) return [[[TODAY - TELEMETRY_DAY_MS, "3", "2", "0"], [TODAY, "9", "1", "5"]], []];
      if (options.sql.startsWith("select `page`,")) return [[["home", "7"], ["post", "5"]], []];
      if (options.sql.startsWith("select `source`,")) return [[["search", "8"], ["direct", "4"]], []];
      if (options.sql.includes("group by `cms_telemetry_counts`.`minuteBucket`")) return [[[MINUTE, "home", "pageview", "5"], [MINUTE, "home", "store_click", "1"]], []];
      return [[[TODAY - 10 * TELEMETRY_DAY_MS]], []];
    });
    const summary = await getTelemetrySummary(7, NOW);
    expect(summary).toMatchObject({ startedAt: TODAY - 10 * TELEMETRY_DAY_MS, pageViews: 12, storeClicks: 3, recentViews: 5 });
    expect(summary.daily.slice(-2)).toEqual([{ day: "2026-11-05", views: 3, storeClicks: 2 }, { day: "2026-11-06", views: 9, storeClicks: 1 }]);
    expect(summary.pages).toEqual([{ page: "home", views: 7 }, { page: "post", views: 5 }]);
    expect(summary.sources).toEqual([{ source: "search", views: 8 }, { source: "direct", views: 4 }]);
    expect(summary.feed).toEqual([{ minute: MINUTE, page: "home", kind: "pageview", count: 5 }, { minute: MINUTE, page: "home", kind: "store_click", count: 1 }]);
    const [feedOptions, feedParams] = query.mock.calls[4];
    expect(feedOptions.sql).toContain("group by `cms_telemetry_counts`.`minuteBucket`, `cms_telemetry_counts`.`page`, `cms_telemetry_counts`.`kind`");
    expect(feedOptions.sql).not.toMatch(/group by .*source/);
    expect(feedParams.at(-1)).toBe(20);
    expect(JSON.stringify(summary)).not.toMatch(/unique|sessions|visitor|referrer|userAgent|ipAddress/);
  });
  it("includes only pageviews in page/source counts and uses five minute buckets for recentViews", async () => {
    const { query } = fakeDatabase();
    query.mockResolvedValue([[], []]);
    await getTelemetrySummary(30, NOW);
    expect(query.mock.calls[1][1]).toContain(MINUTE - 4 * 60_000);
    for (const call of query.mock.calls.slice(2, 4)) {
      expect(call[0].sql).toContain("`cms_telemetry_counts`.`kind` = ?");
      expect(call[1]).toContain("pageview");
    }
  });
  it("handles SQL SUM nulls as genuine zero, but rejects invalid counters", async () => {
    const { query } = fakeDatabase();
    query.mockImplementation(async (options: { sql: string }) => options.sql.includes("group by floor(") ? [[[TODAY, null, null, null]], []] : [[], []]);
    expect(await getTelemetrySummary(7, NOW)).toMatchObject({ pageViews: 0, storeClicks: 0, recentViews: 0 });
    query.mockImplementation(async (options: { sql: string }) => options.sql.includes("group by floor(") ? [[[TODAY, "invalid", "0", "0"]], []] : [[], []]);
    await expect(getTelemetrySummary(7, NOW)).rejects.toThrow("Invalid telemetry counter");
  });
});
