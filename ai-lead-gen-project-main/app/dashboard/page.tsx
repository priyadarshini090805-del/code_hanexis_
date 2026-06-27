'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  totalLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalWorkflows: number;
  recentActivity: any[];
  upcomingScheduled: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = 'cookie';
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load dashboard');
      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <Link href="/dashboard/leads" className="bg-neutral-50 p-6 rounded-lg hover:shadow-lg transition">
                <p className="text-sm text-neutral-800 font-medium">Total Leads</p>
                <p className="text-3xl font-bold text-neutral-900">{data.totalLeads}</p>
              </Link>

              <Link href="/dashboard/campaigns" className="bg-neutral-50 p-6 rounded-lg hover:shadow-lg transition">
                <p className="text-sm text-neutral-800 font-medium">Campaigns</p>
                <p className="text-3xl font-bold text-neutral-900">{data.totalCampaigns}</p>
              </Link>

              <Link href="/dashboard/workflows" className="bg-neutral-50 p-6 rounded-lg hover:shadow-lg transition">
                <p className="text-sm text-neutral-800 font-medium">Workflows</p>
                <p className="text-3xl font-bold text-neutral-900">{data.totalWorkflows}</p>
              </Link>

              <Link href="/dashboard/content" className="bg-neutral-50 p-6 rounded-lg hover:shadow-lg transition">
                <p className="text-sm text-neutral-800 font-medium">Content Pieces</p>
                <p className="text-3xl font-bold text-neutral-900">0</p>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="font-semibold text-black mb-4">Upcoming Schedule</h2>
                {data.upcomingScheduled && data.upcomingScheduled.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingScheduled.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="p-3 border border-gray-200 rounded">
                        <p className="font-medium text-black text-sm">{item.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(item.scheduledFor).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No scheduled content</p>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="font-semibold text-black mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link href="/dashboard/leads/import" className="block p-3 border border-gray-200 rounded hover:bg-gray-50 text-sm text-black">
                    + Import Leads
                  </Link>
                  <Link href="/dashboard/campaigns/new" className="block p-3 border border-gray-200 rounded hover:bg-gray-50 text-sm text-black">
                    + Create Campaign
                  </Link>
                  <Link href="/dashboard/workflows/new" className="block p-3 border border-gray-200 rounded hover:bg-gray-50 text-sm text-black">
                    + Create Workflow
                  </Link>
                  <Link href="/dashboard/content/editor" className="block p-3 border border-gray-200 rounded hover:bg-gray-50 text-sm text-black">
                    + Create Content
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
