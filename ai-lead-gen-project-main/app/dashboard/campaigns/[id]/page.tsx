'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  leads: any[];
  createdAt: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch(`/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Campaign not found');
      const data = await response.json();
      setCampaign(data.data);

      const statsResponse = await fetch(`/api/campaigns/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading campaign...</div>;
  if (!campaign) return <div className="p-8 text-center text-neutral-600">Campaign not found</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">{campaign.name}</h1>
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

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-black">{stats.totalLeads}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <p className="text-sm text-neutral-800">Contacted</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.contacted}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <p className="text-sm text-neutral-800">Responded</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.responded}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <p className="text-sm text-neutral-800">Converted</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.converted}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="font-semibold text-black mb-4">Campaign Details</h2>
              <p className="text-sm text-gray-600">{campaign.description}</p>
              <p className="text-xs text-gray-500 mt-4">
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-4">Status</h3>
              <p className={`px-3 py-1 rounded-full text-sm font-semibold ${
                campaign.status === 'RUNNING' ? 'bg-neutral-100 text-neutral-800' :
                campaign.status === 'COMPLETED' ? 'bg-neutral-100 text-neutral-800' :
                campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                'bg-neutral-100 text-neutral-800'
              }`}>
                {campaign.status}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Leads ({campaign.leads.length})</h2>
            <Link href={`/dashboard/campaigns/${id}/leads`} className="text-neutral-600 hover:text-neutral-800">
              View all →
            </Link>
          </div>

          {campaign.leads.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.leads.slice(0, 5).map((cl: any) => (
                    <tr key={cl.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">{cl.lead?.firstName} {cl.lead?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cl.lead?.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cl.lead?.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No leads added yet</p>
          )}
        </div>

        <div className="mt-8">
          <Link href={`/dashboard/campaigns/${id}/analytics`} className="text-neutral-600 hover:text-neutral-800">
            View analytics →
          </Link>
        </div>
      </div>
    </div>
  );
}
