'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CampaignMetrics {
  id: string;
  name: string;
  totalLeads: number;
  contacted: number;
  responded: number;
  converted: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  conversionRate: number;
  avgResponseTime: number;
}

function CampaignAnalyticsPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('id');

  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (campaignId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchMetrics();
    }
  }, [campaignId, period]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/campaigns/${campaignId}/analytics?period=${period}`,
      );

      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.data?.metrics);
      setDailyMetrics(data.data?.dailyMetrics || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Campaign not found</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">{metrics.name} - Analytics</h1>
          <Link href="/dashboard/campaigns" className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-[var(--hx-surface-secondary)] border border-[var(--hx-border)] rounded-lg mb-6">
            <p className="text-[var(--hx-text)]">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--hx-text)]">Performance Metrics</h2>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-4 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg border border-[var(--hx-border)]">
              <p className="text-sm text-[var(--hx-text)] font-medium">Total Leads</p>
              <p className="text-3xl font-bold text-[var(--hx-text)]">{metrics.totalLeads}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg border border-[var(--hx-border)]">
              <p className="text-sm text-[var(--hx-text)] font-medium">Contacted</p>
              <p className="text-3xl font-bold text-[var(--hx-text)]">{metrics.contacted}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg border border-[var(--hx-border)]">
              <p className="text-sm text-[var(--hx-text)] font-medium">Responses</p>
              <p className="text-3xl font-bold text-[var(--hx-text)]">{metrics.responded}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg border border-[var(--hx-border)]">
              <p className="text-sm text-[var(--hx-text)] font-medium">Conversions</p>
              <p className="text-3xl font-bold text-[var(--hx-text)]">{metrics.converted}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text-secondary)]">Open Rate</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{metrics.openRate.toFixed(1)}%</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text-secondary)]">Click Rate</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{metrics.clickRate.toFixed(1)}%</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text-secondary)]">Conversion Rate</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {dailyMetrics.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--hx-text)] mb-4">Daily Breakdown</h2>
            <div className="border border-[var(--hx-border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--hx-surface-secondary)] border-b border-[var(--hx-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Date</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Contacted</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Opened</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Clicked</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Responded</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetrics.map((m, idx) => (
                    <tr key={idx} className="border-b border-[var(--hx-border)] hover:bg-[var(--hx-surface-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--hx-text)]">{new Date(m.date).toLocaleDateString()}</td>
                      <td className="text-right px-4 py-3 text-sm text-[var(--hx-text)]">{m.contacted}</td>
                      <td className="text-right px-4 py-3 text-sm text-[var(--hx-text)]">{m.opened}</td>
                      <td className="text-right px-4 py-3 text-sm text-[var(--hx-text)]">{m.clicked}</td>
                      <td className="text-right px-4 py-3 text-sm text-[var(--hx-text)]">{m.responded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--hx-text-secondary)]">Loading…</div>}>
      <CampaignAnalyticsPage />
    </Suspense>
  )
}
