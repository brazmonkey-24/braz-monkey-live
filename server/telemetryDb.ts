import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { cmsTelemetryCounts } from "../drizzle/schema";
import {
  TELEMETRY_PAGES, TELEMETRY_SOURCES,
  type TelemetryDays, type TelemetryRecordInput, type TelemetrySummary,
} from "../shared/telemetry";
import { getDb } from "./db";

export const TELEMETRY_MINUTE_MS = 60_000;
export const TELEMETRY_DAY_MS = 86_400_000;
export function telemetryMinute(now: number): number {
  return Math.floor(now / TELEMETRY_MINUTE_MS) * TELEMETRY_MINUTE_MS;
}
export function telemetryWindowStart(days: TelemetryDays, now: number): number {
  return Math.floor(now / TELEMETRY_DAY_MS) * TELEMETRY_DAY_MS - (days - 1) * TELEMETRY_DAY_MS;
}

async function requireTelemetryDb() {
  const db = await getDb();
  if (!db) throw new Error("Telemetry database unavailable");
  return db;
}

/** Only allowlisted dimensions, server time and a counter reach persistence. */
export async function incrementTelemetry(input: TelemetryRecordInput, now: number): Promise<void> {
  const db = await requireTelemetryDb();
  await db.insert(cmsTelemetryCounts).values({
    minuteBucket: telemetryMinute(now),
    kind: input.kind,
    page: input.page,
    source: input.source,
    count: 1,
  }).onDuplicateKeyUpdate({ set: { count: sql`${cmsTelemetryCounts.count} + 1` } });
}

function numericCount(value: unknown): number {
  const count = Number(value ?? 0);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid telemetry counter");
  return count;
}

/** Aggregate in SQL: at most days daily bins, 7 pages, 5 sources and 20 feed rows. */
export async function getTelemetrySummary(days: TelemetryDays, now: number): Promise<TelemetrySummary> {
  const db = await requireTelemetryDb();
  const table = cmsTelemetryCounts;
  const start = telemetryWindowStart(days, now);
  const end = telemetryMinute(now);
  const recentStart = end - 4 * TELEMETRY_MINUTE_MS;
  const window = and(gte(table.minuteBucket, start), lte(table.minuteBucket, end));
  const pageviewWindow = and(window, eq(table.kind, "pageview"));
  const dayBucket = sql<number>`floor(${table.minuteBucket} / ${TELEMETRY_DAY_MS}) * ${TELEMETRY_DAY_MS}`;
  const viewCount = sql<number>`sum(case when ${table.kind} = 'pageview' then ${table.count} else 0 end)`;
  const clickCount = sql<number>`sum(case when ${table.kind} = 'store_click' then ${table.count} else 0 end)`;
  const recentCount = sql<number>`sum(case when ${table.kind} = 'pageview' and ${table.minuteBucket} >= ${recentStart} then ${table.count} else 0 end)`;
  const sumCount = sql<number>`sum(${table.count})`;

  const [first, dayRows, pageRows, sourceRows, feedRows] = await Promise.all([
    // This indexed LIMIT 1 establishes the collection start, not a historical raw-row scan.
    db.select({ minuteBucket: table.minuteBucket }).from(table).orderBy(asc(table.minuteBucket)).limit(1),
    db.select({ dayBucket, views: viewCount, storeClicks: clickCount, recentViews: recentCount })
      .from(table).where(window).groupBy(dayBucket).orderBy(asc(dayBucket)).limit(days),
    db.select({ page: table.page, views: sumCount }).from(table).where(pageviewWindow)
      .groupBy(table.page).orderBy(desc(sumCount), asc(table.page)).limit(TELEMETRY_PAGES.length),
    db.select({ source: table.source, views: sumCount }).from(table).where(pageviewWindow)
      .groupBy(table.source).orderBy(desc(sumCount), asc(table.source)).limit(TELEMETRY_SOURCES.length),
    db.select({ minute: table.minuteBucket, page: table.page, kind: table.kind, count: sumCount })
      .from(table).where(window).groupBy(table.minuteBucket, table.page, table.kind)
      .orderBy(desc(table.minuteBucket), asc(table.page), asc(table.kind)).limit(20),
  ]);

  const byDay = new Map(dayRows.map(row => [Number(row.dayBucket), row]));
  const daily = Array.from({ length: days }, (_, index) => {
    const bucket = start + index * TELEMETRY_DAY_MS;
    const row = byDay.get(bucket);
    return {
      day: new Date(bucket).toISOString().slice(0, 10),
      views: numericCount(row?.views),
      storeClicks: numericCount(row?.storeClicks),
    };
  });
  return {
    updatedAt: now,
    startedAt: first[0]?.minuteBucket ?? null,
    pageViews: numericCount(daily.reduce((total, day) => total + day.views, 0)),
    storeClicks: numericCount(daily.reduce((total, day) => total + day.storeClicks, 0)),
    recentViews: numericCount(dayRows.reduce((total, row) => total + numericCount(row.recentViews), 0)),
    daily,
    pages: pageRows.map(row => ({ page: row.page, views: numericCount(row.views) })),
    sources: sourceRows.map(row => ({ source: row.source, views: numericCount(row.views) })),
    feed: feedRows.map(row => ({ minute: row.minute, page: row.page, kind: row.kind, count: numericCount(row.count) })),
  };
}
