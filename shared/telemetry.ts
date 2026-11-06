export const TELEMETRY_KINDS = ["pageview", "store_click"] as const;
export const TELEMETRY_PAGES = [
  "home", "transmissions", "origin", "archive", "follow", "blackbook", "post",
] as const;
export const TELEMETRY_SOURCES = ["direct", "internal", "search", "social", "other"] as const;
export const TELEMETRY_DAYS = [7, 30, 90] as const;

export type TelemetryKind = typeof TELEMETRY_KINDS[number];
export type TelemetryPage = typeof TELEMETRY_PAGES[number];
export type TelemetrySource = typeof TELEMETRY_SOURCES[number];
export type TelemetryDays = typeof TELEMETRY_DAYS[number];
export type TelemetryRecordInput = {
  kind: TelemetryKind;
  page: TelemetryPage;
  source: TelemetrySource;
};
export type TelemetrySummary = {
  updatedAt: number;
  startedAt: number | null;
  pageViews: number;
  storeClicks: number;
  /** Event count in five minute buckets, not unique people or sessions. */
  recentViews: number;
  daily: Array<{ day: string; views: number; storeClicks: number }>;
  pages: Array<{ page: string; views: number }>;
  sources: Array<{ source: string; views: number }>;
  /** Aggregate counters only; sources are combined for each minute/page/kind. */
  feed: Array<{ minute: number; page: string; kind: string; count: number }>;
};
