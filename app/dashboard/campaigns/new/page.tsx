'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Workflow {
  id: string;
  name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workflowId: '',
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leadsLoading, setLeadsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchWorkflows();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = 'cookie';
      const response = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const token = 'cookie';
      const response = await fetch('/api/workflows', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Campaign name is required');
      return;
    }

    if (selectedLeads.size === 0) {
      setError('Please select at least one lead');
      return;
    }

    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          leadIds: Array.from(selectedLeads),
        }),
      });

      if (!response.ok) throw new Error('Failed to create campaign');
      const data = await response.json();
      router.push(`/dashboard/campaigns/${data.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">New Campaign</h1>
          <Link href="/dashboard/campaigns" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
          <div className="col-span-1 space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q4 Outreach"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Campaign details..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Workflow (Optional)</label>
              <select
                value={formData.workflowId}
                onChange={e => setFormData({ ...formData, workflowId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a workflow...</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>

          <div className="col-span-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="font-semibold text-black mb-4">
                Select Leads ({selectedLeads.size})
              </h2>

              {leadsLoading ? (
                <p className="text-gray-500">Loading leads...</p>
              ) : leads.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leads.map(lead => (
                    <label key={lead.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="mr-3 w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-black">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No leads available</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
