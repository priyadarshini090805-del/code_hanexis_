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
      const response = await fetch(`/api/campaigns/${id}`, {
      });

      if (!response.ok) throw new Error('Campaign not found');
      const data = await response.json();
      setCampaign(data.data);

      const statsResponse = await fetch(`/api/campaigns/${id}/stats`, {
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

  if (loading) return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Loading campaign...</div>;
  if (!campaign) return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Campaign not found</div>;

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">{campaign.name}</h1>
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

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text-secondary)]">Total Leads</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{stats.totalLeads}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text)]">Contacted</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{stats.contacted}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text)]">Responded</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{stats.responded}</p>
            </div>
            <div className="bg-[var(--hx-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm text-[var(--hx-text)]">Converted</p>
              <p className="text-2xl font-bold text-[var(--hx-text)]">{stats.converted}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2">
            <div className="bg-[var(--hx-surface-secondary)] p-6 rounded-lg">
              <h2 className="font-semibold text-[var(--hx-text)] mb-4">Campaign Details</h2>
              <p className="text-sm text-[var(--hx-text-secondary)]">{campaign.description}</p>
              <p className="text-xs text-[var(--hx-text-secondary)] mt-4">
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <div className="bg-[var(--hx-surface-secondary)] p-6 rounded-lg">
              <h3 className="font-semibold text-[var(--hx-text)] mb-4">Status</h3>
              <p className={`px-3 py-1 rounded-full text-sm font-semibold ${
                campaign.status === 'RUNNING' ? 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]' :
                campaign.status === 'COMPLETED' ? 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]' :
                campaign.status === 'DRAFT' ? 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]' :
                'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]'
              }`}>
                {campaign.status}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--hx-text)]">Leads ({campaign.leads.length})</h2>
            <Link href={`/dashboard/campaigns/${id}/leads`} className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
              View all →
            </Link>
          </div>

          {campaign.leads.length > 0 ? (
            <div className="border border-[var(--hx-border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--hx-surface-secondary)] border-b border-[var(--hx-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.leads.slice(0, 5).map((cl: any) => (
                    <tr key={cl.id} className="border-b border-[var(--hx-border)] hover:bg-[var(--hx-surface-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--hx-text)]">{cl.lead?.firstName} {cl.lead?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">{cl.lead?.email}</td>
                      <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">{cl.lead?.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--hx-text-secondary)] text-center py-8">No leads added yet</p>
          )}
        </div>

        <div className="mt-8">
          <Link href={`/dashboard/campaigns/${id}/analytics`} className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            View analytics →
          </Link>
        </div>
      </div>
    </div>
  );
}
