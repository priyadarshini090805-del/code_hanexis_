'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  leads: any[];
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch(
        `/api/campaigns${filter !== 'ALL' ? `?status=${filter}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-neutral-100 text-neutral-800';
      case 'COMPLETED':
        return 'bg-neutral-100 text-neutral-800';
      case 'PAUSED':
        return 'bg-neutral-100 text-neutral-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAction = async (campaignId: string, action: string) => {
    try {
      const token = 'cookie';
      const response = await fetch(`/api/campaigns/${campaignId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} campaign`);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Campaigns</h1>
          <Link href="/dashboard/campaigns/new" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900">
            + New Campaign
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {['ALL', 'DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-black hover:border-black'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading campaigns...</p>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/campaigns/${c.id}`}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black">{c.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <p>{c.leads.length} leads</p>
                  </div>
                  <div className="space-x-2">
                    {c.status === 'DRAFT' && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          handleAction(c.id, 'start');
                        }}
                        className="text-xs px-2 py-1 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200"
                      >
                        Start
                      </button>
                    )}
                    {c.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={e => {
                            e.preventDefault();
                            handleAction(c.id, 'pause');
                          }}
                          className="text-xs px-2 py-1 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200"
                        >
                          Pause
                        </button>
                        <button
                          onClick={e => {
                            e.preventDefault();
                            handleAction(c.id, 'stop');
                          }}
                          className="text-xs px-2 py-1 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200"
                        >
                          Stop
                        </button>
                      </>
                    )}
                    {c.status === 'PAUSED' && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          handleAction(c.id, 'resume');
                        }}
                        className="text-xs px-2 py-1 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <Link href="/dashboard/campaigns/new" className="text-neutral-600 hover:text-neutral-800">
              Create your first campaign →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
