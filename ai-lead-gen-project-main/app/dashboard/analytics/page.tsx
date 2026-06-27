'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DailyMetric {
  date: string;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  campaignsRun: number;
  messagesGenerated: number;
  tokensUsed: number;
}

interface AnalyticsData {
  analytics: DailyMetric[];
  leadStats: Record<string, number>;
  completedCampaigns: number;
  totalMessagesGenerated: number;
}

// ─── SVG Line Chart ─────────────────────────────────────────────────────────
function LineChart({
  data,
  keys,
  colors,
  labels,
  height = 200,
}: {
  data: DailyMetric[];
  keys: (keyof DailyMetric)[];
  colors: string[];
  labels: string[];
  height?: number;
}) {
  const W = 600;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>;

  const reversed = [...data].reverse();
  const allVals = reversed.flatMap((d) => keys.map((k) => Number(d[k]) || 0));
  const maxVal = Math.max(...allVals, 1);

  const xScale = (i: number) => (i / (reversed.length - 1 || 1)) * innerW;
  const yScale = (v: number) => innerH - (v / maxVal) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: height + 20 }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={0} x2={innerW} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={-6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.round(maxVal * t)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {keys.map((key, ki) => {
          const pts = reversed.map((d, i) => `${xScale(i)},${yScale(Number(d[key]) || 0)}`).join(' ');
          return (
            <polyline
              key={ki}
              points={pts}
              fill="none"
              stroke={colors[ki]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* Dots on last point */}
        {keys.map((key, ki) => {
          const last = reversed[reversed.length - 1];
          if (!last) return null;
          return (
            <circle
              key={ki}
              cx={xScale(reversed.length - 1)}
              cy={yScale(Number(last[key]) || 0)}
              r={3}
              fill={colors[ki]}
            />
          );
        })}

        {/* X axis labels — show first, mid, last */}
        {[0, Math.floor((reversed.length - 1) / 2), reversed.length - 1].map((i) => {
          const d = reversed[i];
          if (!d) return null;
          const label = new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
          return (
            <text key={i} x={xScale(i)} y={innerH + 20} textAnchor="middle" fontSize={9} fill="#6b7280">
              {label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({
  data,
  colors,
}: {
  data: { label: string; value: number; color?: string }[];
  colors?: string[];
}) {
  const W = 400;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 56, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = (innerW / data.length) * 0.6;
  const gap = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H + 20 }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {[0, 0.5, 1].map((t) => {
          const y = innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={0} x2={innerW} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={-6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.round(maxVal * t)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = (d.value / maxVal) * innerH;
          const x = gap * i + (gap - barW) / 2;
          const y = innerH - barH;
          const color = d.color || (colors?.[i]) || '#000';
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="600">
                  {d.value}
                </text>
              )}
              <text x={x + barW / 2} y={innerH + 16} textAnchor="middle" fontSize={9} fill="#6b7280">
                {d.label.length > 7 ? d.label.slice(0, 7) : d.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 60;
  const CX = 80;
  const CY = 80;
  let angle = -Math.PI / 2;

  return (
    <svg viewBox="0 0 200 160" className="w-full" style={{ maxHeight: 180 }}>
      {data.map((d, i) => {
        const sweep = (d.value / total) * 2 * Math.PI;
        const x1 = CX + R * Math.cos(angle);
        const y1 = CY + R * Math.sin(angle);
        angle += sweep;
        const x2 = CX + R * Math.cos(angle);
        const y2 = CY + R * Math.sin(angle);
        const largeArc = sweep > Math.PI ? 1 : 0;
        const innerR = 38;
        const ix1 = CX + innerR * Math.cos(angle - sweep);
        const iy1 = CY + innerR * Math.sin(angle - sweep);
        const ix2 = CX + innerR * Math.cos(angle);
        const iy2 = CY + innerR * Math.sin(angle);

        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`}
            fill={d.color}
          />
        );
      })}
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#111" fontWeight="700">
        {total}
      </text>
      <text x={CX} y={CY + 14} textAnchor="middle" fontSize={8} fill="#6b7280">
        total
      </text>
      {/* Legend */}
      {data.map((d, i) => (
        <g key={i} transform={`translate(145, ${12 + i * 20})`}>
          <rect width={10} height={10} fill={d.color} rx={2} />
          <text x={14} y={9} fontSize={9} fill="#374151">{d.label}: {d.value}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#a3a3a3',
  CONTACTED: '#737373',
  QUALIFIED: '#525252',
  CONVERTED: '#171717',
  LOST: '#525252',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const [dateRange, setDateRange] = useState({
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  });

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ dateFrom: dateRange.from, dateTo: dateRange.to });
      const res = await fetch(`/api/analytics?${params}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const result = await res.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  const latestMetrics = data?.analytics?.[0] || {} as DailyMetric;
  const totalLeads = Object.values(data?.leadStats || {}).reduce((a, b) => a + b, 0);
  const conversionRate = data?.leadStats?.CONVERTED && totalLeads
    ? Math.round((data.leadStats.CONVERTED / totalLeads) * 100) : 0;

  const kpis = [
    { label: 'Total Leads', value: totalLeads, sub: 'all statuses', trend: '+', color: 'text-neutral-600' },
    { label: 'Contacted', value: data?.leadStats?.CONTACTED || 0, sub: 'leads reached', trend: '+', color: 'text-neutral-600' },
    { label: 'Conversion', value: `${conversionRate}%`, sub: 'leads converted', trend: '+', color: 'text-neutral-600' },
    { label: 'Campaigns', value: data?.completedCampaigns || 0, sub: 'completed', trend: '+', color: 'text-neutral-600' },
  ];

  const leadStatusBars = Object.entries(data?.leadStats || {}).map(([status, count]) => ({
    label: status,
    value: count as number,
    color: LEAD_STATUS_COLORS[status] || '#a3a3a3',
  }));

  const donutData = Object.entries(data?.leadStats || {}).map(([label, value]) => ({
    label,
    value: value as number,
    color: LEAD_STATUS_COLORS[label] || '#a3a3a3',
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your sales and outreach performance</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {error && <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 text-sm">{error}</div>}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Line chart + Donut */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-black">Leads Over Time</h2>
              <div className="flex gap-4 text-xs">
                {[
                  { label: 'New', color: '#a3a3a3' },
                  { label: 'Contacted', color: '#737373' },
                  { label: 'Converted', color: '#171717' },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1">
                    <span className="inline-block w-3 h-1 rounded" style={{ backgroundColor: l.color }} />
                    <span className="text-gray-500">{l.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <LineChart
              data={data?.analytics || []}
              keys={['newLeads', 'contactedLeads', 'convertedLeads']}
              colors={['#a3a3a3', '#737373', '#171717']}
              labels={['New', 'Contacted', 'Converted']}
              height={200}
            />
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-black mb-4">Lead Funnel</h2>
            <DonutChart data={donutData} />
          </div>
        </div>

        {/* Bar chart + AI Usage */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-black mb-4">Lead Status Breakdown</h2>
            <BarChart data={leadStatusBars} />
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-black mb-4">AI & Campaign Stats</h2>
            <div className="space-y-4">
              {[
                { label: 'Messages Generated', value: data?.totalMessagesGenerated || 0, color: 'bg-neutral-500' },
                { label: 'Completed Campaigns', value: data?.completedCampaigns || 0, color: 'bg-neutral-500' },
                { label: 'AI Tokens Used', value: latestMetrics.tokensUsed || 0, color: 'bg-neutral-500' },
              ].map((s) => {
                const maxRef = Math.max(data?.totalMessagesGenerated || 1, data?.completedCampaigns || 1);
                const pct = Math.min((s.value / maxRef) * 100, 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="font-semibold text-black">{s.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${s.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-black mb-3">Messages Over Time</h3>
                <LineChart
                  data={data?.analytics || []}
                  keys={['messagesGenerated']}
                  colors={['#525252']}
                  labels={['Messages']}
                  height={120}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black">Daily Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'New Leads', 'Contacted', 'Converted', 'Conv. Rate', 'Messages'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.analytics || []).slice(0, 10).map((metric, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(metric.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-black">{metric.newLeads}</td>
                    <td className="px-4 py-3 font-medium text-black">{metric.contactedLeads}</td>
                    <td className="px-4 py-3 font-medium text-black">{metric.convertedLeads}</td>
                    <td className="px-4 py-3 font-medium text-black">{Math.round(metric.conversionRate)}%</td>
                    <td className="px-4 py-3 font-medium text-black">{metric.messagesGenerated}</td>
                  </tr>
                ))}
                {!data?.analytics?.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
