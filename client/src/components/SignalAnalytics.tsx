import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, Radio, Sparkles, Users, Zap } from "lucide-react";

type Range = "7D" | "30D" | "90D";

type SignalSet = {
  visits: number;
  unique: number;
  returnRate: number;
  avgSession: string;
  trend: Array<{ label: string; visitors: number; signals: number }>;
  reach: Array<{ label: string; reach: number }>;
};

const DATA: Record<Range, SignalSet> = {
  "7D": {
    visits: 12840,
    unique: 8170,
    returnRate: 38.6,
    avgSession: "04:18",
    trend: [
      { label: "MON", visitors: 1420, signals: 890 },
      { label: "TUE", visitors: 1760, signals: 1040 },
      { label: "WED", visitors: 2310, signals: 1540 },
      { label: "THU", visitors: 1980, signals: 1210 },
      { label: "FRI", visitors: 2820, signals: 1980 },
      { label: "SAT", visitors: 1560, signals: 1080 },
      { label: "SUN", visitors: 990, signals: 760 },
    ],
    reach: [
      { label: "VINYL", reach: 86 },
      { label: "QUOTES", reach: 72 },
      { label: "BLACKBOOK", reach: 58 },
      { label: "PREDICTIONS", reach: 47 },
    ],
  },
  "30D": {
    visits: 49780,
    unique: 28490,
    returnRate: 42.1,
    avgSession: "05:02",
    trend: [
      { label: "W1", visitors: 8200, signals: 5020 },
      { label: "W2", visitors: 10980, signals: 7340 },
      { label: "W3", visitors: 14560, signals: 9820 },
      { label: "W4", visitors: 16040, signals: 11260 },
    ],
    reach: [
      { label: "VINYL", reach: 91 },
      { label: "QUOTES", reach: 76 },
      { label: "BLACKBOOK", reach: 63 },
      { label: "PREDICTIONS", reach: 54 },
    ],
  },
  "90D": {
    visits: 142600,
    unique: 76140,
    returnRate: 47.8,
    avgSession: "05:37",
    trend: [
      { label: "APR", visitors: 23800, signals: 14020 },
      { label: "MAY", visitors: 31800, signals: 20780 },
      { label: "JUN", visitors: 40240, signals: 28660 },
      { label: "JUL", visitors: 46800, signals: 33980 },
    ],
    reach: [
      { label: "VINYL", reach: 94 },
      { label: "QUOTES", reach: 82 },
      { label: "BLACKBOOK", reach: 71 },
      { label: "PREDICTIONS", reach: 66 },
    ],
  },
};

const MIX = [
  { name: "VINYL", value: 42, color: "#f5e642" },
  { name: "QUOTES", value: 31, color: "#ff3e8a" },
  { name: "BLACKBOOK", value: 17, color: "#ff5c4d" },
  { name: "PREDICTIONS", value: 10, color: "#f0eee4" },
];

const SOURCES = [
  { label: "DIRECT / UNKNOWN", value: "44%", note: "The signal found them." },
  { label: "INSTAGRAM", value: "27%", note: "Visual fragments travelling." },
  { label: "YOUTUBE", value: "18%", note: "Archive trail still warm." },
  { label: "OTHER PLANETS", value: "11%", note: "Unverified." },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="signal-chart-tooltip">
      <p>{label}</p>
      {payload.map((item) => (
        <strong key={item.name} style={{ color: item.color || "#f5e642" }}>
          {item.name?.toUpperCase()}: {formatNumber(Number(item.value || 0))}
        </strong>
      ))}
    </div>
  );
}

function MetricCard({ label, value, delta, icon: Icon, tone = "yellow" }: { label: string; value: string; delta: string; icon: typeof Activity; tone?: string }) {
  return (
    <article className={`signal-metric signal-metric-${tone} signal-col-3`}>
      <div className="signal-metric-top"><span>{label}</span><Icon size={16} strokeWidth={1.5} /></div>
      <strong>{value}</strong>
      <small><ArrowUpRight size={12} /> {delta}</small>
    </article>
  );
}

export function SignalAnalytics() {
  const [range, setRange] = useState<Range>("30D");
  const [showSignals, setShowSignals] = useState(true);
  const data = DATA[range];
  const peak = useMemo(() => Math.max(...data.trend.map((item) => item.visitors)), [data.trend]);

  return (
    <section id="telemetry" className="signal-analytics-section" aria-labelledby="telemetry-title">
      <div className="signal-analytics-grid">
        <div className="signal-dashboard-head signal-col-12">
          <div>
            <p className="eyebrow">// SIGNAL TELEMETRY <span>FIELD UNIT 00.404</span></p>
            <h2 id="telemetry-title">THE<br /><em>NUMBERS</em></h2>
          </div>
          <div className="signal-dashboard-status">
            <span className="live-dot" /> LIVE COLLECTION
            <small>Illustrative site telemetry · last sync 00:04:04 UTC</small>
          </div>
        </div>

        <div className="signal-range-bar signal-col-12">
          <div className="signal-range-copy"><Radio size={15} /> PICK A WINDOW <span>/ THE PLANET KEEPS MOVING</span></div>
          <div className="signal-range-buttons" role="group" aria-label="Telemetry date range">
            {(["7D", "30D", "90D"] as Range[]).map((item) => (
              <button key={item} type="button" className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>
            ))}
          </div>
        </div>

        <MetricCard label="SIGNAL VISITS" value={formatNumber(data.visits)} delta="12.4% vs prior window" icon={Activity} />
        <MetricCard label="UNIQUE EARTHLINGS" value={formatNumber(data.unique)} delta="8.8% new arrivals" icon={Users} tone="pink" />
        <MetricCard label="RETURN FREQUENCY" value={`${data.returnRate}%`} delta="4.1% signal loyalty" icon={Zap} tone="red" />
        <MetricCard label="AVG. ORBIT TIME" value={data.avgSession} delta="mm:ss per visit" icon={Sparkles} tone="paper" />

        <article className="signal-panel signal-panel-trend signal-col-7">
          <div className="signal-panel-head">
            <div><span className="signal-panel-index">01</span><div><p className="eyebrow">// ARRIVALS / {range}</p><h3>VISITORS FIND<br /><em>THE SIGNAL</em></h3></div></div>
            <button type="button" className={`signal-toggle ${showSignals ? "active" : ""}`} onClick={() => setShowSignals((value) => !value)} aria-pressed={showSignals}><i /> SIGNAL LAYER</button>
          </div>
          <div className="signal-chart-frame signal-chart-tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5e642" stopOpacity={0.32} /><stop offset="100%" stopColor="#f5e642" stopOpacity={0} /></linearGradient>
                  <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff3e8a" stopOpacity={0.22} /><stop offset="100%" stopColor="#ff3e8a" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(240,238,228,.1)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "rgba(240,238,228,.55)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(240,238,228,.45)", fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "#f5e642", strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="visitors" name="visitors" stroke="#f5e642" strokeWidth={2} fill="url(#visitorFill)" activeDot={{ r: 5, fill: "#ff3e8a", stroke: "#090a09" }} />
                {showSignals && <Area type="monotone" dataKey="signals" name="signals" stroke="#ff3e8a" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#signalFill)" activeDot={{ r: 4, fill: "#ff3e8a", stroke: "#090a09" }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="signal-chart-foot"><span><i className="legend-yellow" /> visitors</span>{showSignals && <span><i className="legend-pink" /> transmissions opened</span>}<strong>PEAK {formatNumber(peak)}</strong></div>
        </article>

        <article className="signal-panel signal-panel-mix signal-col-5">
          <div className="signal-panel-head"><div><span className="signal-panel-index">02</span><div><p className="eyebrow">// CONTENT GRAVITY</p><h3>WHAT<br /><em>STICKS</em></h3></div></div><span className="signal-panel-code">MIX / 100</span></div>
          <div className="signal-pie-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MIX} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} stroke="none">
                  {MIX.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="signal-pie-center"><strong>42%</strong><span>VINYL<br />PULL</span></div>
          </div>
          <div className="signal-mix-list">{MIX.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}%</strong></div>)}</div>
        </article>

        <article className="signal-panel signal-panel-reach signal-col-4">
          <div className="signal-panel-head"><div><span className="signal-panel-index">03</span><div><p className="eyebrow">// REACH INDEX</p><h3>WHERE<br /><em>IT LANDS</em></h3></div></div></div>
          <div className="signal-chart-frame signal-chart-small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.reach} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="rgba(240,238,228,.08)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="label" width={82} tick={{ fill: "rgba(240,238,228,.62)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(245,230,66,.06)" }} />
                <Bar dataKey="reach" name="reach index" fill="#f5e642" radius={[0, 2, 2, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="signal-panel signal-panel-sources signal-col-4">
          <div className="signal-panel-head"><div><span className="signal-panel-index">04</span><div><p className="eyebrow">// ENTRY VECTORS</p><h3>HOW THEY<br /><em>ARRIVE</em></h3></div></div></div>
          <div className="signal-source-list">{SOURCES.map((source) => <div key={source.label} className="signal-source-row"><div><span>{source.label}</span><small>{source.note}</small></div><strong>{source.value}</strong></div>)}</div>
        </article>

        <article className="signal-panel signal-panel-notes signal-col-4">
          <div className="signal-panel-head"><div><span className="signal-panel-index">05</span><div><p className="eyebrow">// FIELD NOTES</p><h3>READ THE<br /><em>STATIC</em></h3></div></div></div>
          <div className="signal-note-list">
            <p><span>01</span><strong>Friday still bends gravity.</strong> The vinyl drop is the clearest repeat-visit trigger.</p>
            <p><span>02</span><strong>Blackbook is a quiet engine.</strong> Fewer visits, longer sessions, more fingerprints.</p>
            <p><span>03</span><strong>Direct traffic is not a mystery.</strong> It is the sound of a signal worth remembering.</p>
          </div>
        </article>

        <div className="signal-data-strip signal-col-12"><span><span className="live-dot" /> COLLECTION RUNNING</span><span>DATASET: BRAZ MONKEY / SITE TELEMETRY / {range}</span><span>NO COOKIES. JUST CLUES.</span></div>
      </div>
    </section>
  );
}
