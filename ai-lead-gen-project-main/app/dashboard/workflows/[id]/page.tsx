'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface WorkflowStep {
  id: string;
  stepNumber: number;
  type: 'MESSAGE' | 'DELAY' | 'CONDITION' | 'BRANCH';
  content?: any;
  delayMs?: number;
  condition?: string;
  branchTrue?: string;
  branchFalse?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps: WorkflowStep[];
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchWorkflow();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch(`/api/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Workflow not found');

      const data = await response.json();
      setWorkflow(data.data?.workflow);
      setFormData({
        name: data.data?.workflow?.name || '',
        description: data.data?.workflow?.description || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = 'cookie';
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

      setEditing(false);
      await fetchWorkflow();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading workflow...</div>;
  }

  if (!workflow) {
    return <div className="p-8 text-center text-neutral-600">Workflow not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">{workflow.name}</h1>
          <Link href="/dashboard/workflows" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Workflow Details</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  rows={4}
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">{workflow.description || 'No description'}</p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium">{workflow.isActive ? 'Active' : 'Inactive'}</span>
              </p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black">Steps ({workflow.steps.length})</h2>
            <Link
              href={`/dashboard/workflows/${id}/builder`}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900"
            >
              Add Step
            </Link>
          </div>

          {workflow.steps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No steps yet</p>
          ) : (
            <div className="space-y-4">
              {workflow.steps.map((step, idx) => (
                <div key={step.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-black">Step {step.stepNumber}: {step.type}</p>
                      {step.type === 'DELAY' && (
                        <p className="text-sm text-gray-600 mt-1">{(step.delayMs || 0) / 1000}s delay</p>
                      )}
                      {step.type === 'MESSAGE' && (
                        <p className="text-sm text-gray-600 mt-1">{step.content?.message || 'Message'}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">#{idx + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
