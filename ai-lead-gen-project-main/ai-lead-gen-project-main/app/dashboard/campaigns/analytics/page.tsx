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
      const token = 'cookie';
      const response = await fetch(
        `/api/campaigns/${campaignId}/analytics?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    return <div className="p-8 text-center text-gray-500">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-neutral-600">Campaign not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">{metrics.name} - Analytics</h1>
          <Link href="/dashboard/campaigns" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Performance Metrics</h2>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-800 font-medium">Total Leads</p>
              <p className="text-3xl font-bold text-neutral-900">{metrics.totalLeads}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-800 font-medium">Contacted</p>
              <p className="text-3xl font-bold text-neutral-900">{metrics.contacted}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-800 font-medium">Responses</p>
              <p className="text-3xl font-bold text-neutral-900">{metrics.responded}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-800 font-medium">Conversions</p>
              <p className="text-3xl font-bold text-neutral-900">{metrics.converted}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-black">{metrics.openRate.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-black">{metrics.clickRate.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-black">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {dailyMetrics.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-black mb-4">Daily Breakdown</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Date</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Contacted</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Opened</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Clicked</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Responded</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetrics.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">{new Date(m.date).toLocaleDateString()}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.contacted}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.opened}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.clicked}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.responded}</td>
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
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <CampaignAnalyticsPage />
    </Suspense>
  )
}
