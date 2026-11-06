import { useState } from "react";
import { Activity, Radio, ShoppingBag } from "lucide-react";
import { trpc } from "@/lib/trpc";

const number = (value: number) => new Intl.NumberFormat().format(value);
const pageNames: Record<string, string> = { home: "SIGNAL", transmissions: "TRANSMISSIONS", origin: "ORIGIN", archive: "ARCHIVE", follow: "FOLLOW", blackbook: "BLACKBOOK", post: "FULL RELEASE" };

/** Mounted only inside the authenticated CMS. Backend independently checks CMS auth. */
export function SignalAnalytics() {
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const query = trpc.telemetry.summary.useQuery({ days }, { refetchInterval: 10000, refetchOnWindowFocus: true, retry: false });
  const data = query.data;
  const peak = Math.max(1, ...(data?.daily ?? []).map((row) => row.views));
  return <section className="cms-workspace-panel cms-live-telemetry" aria-labelledby="cms-telemetry-title">
    <div className="cms-section-heading"><div><p className="admin-eyebrow">// PRIVATE LIVE TELEMETRY</p><h2 id="cms-telemetry-title">THE NUMBERS</h2></div><span className="admin-badge admin-badge-vinyl">CMS ONLY</span></div>
    <div className="cms-live-toolbar"><div><Radio size={15} /><span>{query.isError ? "FEED UNAVAILABLE" : query.isLoading ? "CONNECTING..." : "LIVE DATABASE FEED"}</span></div><div className="cms-live-ranges" role="group" aria-label="Telemetry time window">{([7, 30, 90] as const).map((value) => <button type="button" key={value} className={days === value ? "active" : "ghost"} onClick={() => setDays(value)}>{value}D</button>)}</div><button type="button" className="ghost" onClick={() => query.refetch()} disabled={query.isFetching}>REFRESH</button></div>
    <p className="cms-live-explainer">Actual page-view and STORE-click events from this website, refreshed every 10 seconds. Counts are events, not unique visitors. No historical sample numbers, visitor profiles, cookies or stored IP addresses. Events from the CMS, preview hosts, recognized bots, and browsers opting out with DNT/GPC are excluded.</p>
    {query.isLoading && <p className="admin-status" role="status">LOADING LIVE COUNTS...</p>}
    {query.isError && <p className="admin-error" role="alert">Live telemetry could not be loaded. Check your CMS session and database connection. No sample or zero counts are being substituted.</p>}
    {!query.isError && data && <>
      <div className="cms-live-meta"><span>LAST REFRESH: {new Date(data.updatedAt).toLocaleString()}</span><span>COLLECTION SINCE: {data.startedAt ? new Date(data.startedAt).toLocaleString() : "WAITING FOR FIRST PUBLIC EVENT"}</span></div>
      <div className="cms-live-metrics"><article><Activity size={18} /><span>PAGE VIEWS / {days}D</span><strong>{number(data.pageViews)}</strong></article><article><Radio size={18} /><span>PAGE VIEWS / LAST 5 MIN</span><strong>{number(data.recentViews)}</strong></article><article><ShoppingBag size={18} /><span>STORE CLICKS / {days}D</span><strong>{number(data.storeClicks)}</strong></article></div>
      {data.startedAt === null && <p className="cms-live-empty" role="status">No real public events have arrived yet. This feed starts with collection, not invented past visitor numbers.</p>}
      <div className="cms-live-columns"><article className="cms-live-block"><h3>DAILY PAGE VIEWS · UTC</h3><div className="cms-live-trend" role="img" aria-label={`Daily page views during the last ${days} days`}>{data.daily.map((row) => <div key={row.day} title={`${row.day}: ${row.views} page views, ${row.storeClicks} STORE clicks`}><i style={{ height: `${Math.max(row.views ? 2 : 0, row.views / peak * 100)}%` }} /><small>{row.day.slice(5)}</small></div>)}</div><p className="cms-live-small">Hover a bar for exact counts. UTC buckets; last {days} days.</p></article><article className="cms-live-block"><h3>PUBLIC PAGES</h3>{data.pages.length ? data.pages.map((row) => <div className="cms-live-row" key={row.page}><span>{pageNames[row.page] ?? row.page}</span><b>{number(row.views)}</b></div>) : <p className="cms-live-small">No page views recorded.</p>}<h3 className="cms-live-subheading">REFERRER CATEGORIES</h3>{data.sources.map((row) => <div className="cms-live-row" key={row.source}><span>{row.source.toUpperCase()}</span><b>{number(row.views)}</b></div>)}<p className="cms-live-small">Categories only. No full referrer URL is collected.</p></article></div>
      <article className="cms-live-block"><h3>RECENT LIVE FEED</h3><p className="cms-live-small">Latest aggregate minute buckets in the selected window, not individual visitor records. STORE clicks measure navigation intent, not completed Shopify purchases.</p><div className="cms-live-feed" role="log" aria-live="off">{data.feed.length ? data.feed.map((row) => <div className="cms-live-feed-row" key={`${row.minute}-${row.page}-${row.kind}`}><time dateTime={new Date(row.minute).toISOString()}>{new Date(row.minute).toLocaleString()}</time><span>{pageNames[row.page] ?? row.page}</span><span>{row.kind === "store_click" ? "STORE CLICK" : "PAGE VIEW"}</span><b>× {number(row.count)}</b></div>) : <p className="cms-live-small">Waiting for public activity.</p>}</div></article>
    </>}
  </section>;
}
