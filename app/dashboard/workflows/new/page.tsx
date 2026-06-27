'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Workflow name is required');
      return;
    }

    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create workflow');
      const data = await response.json();
      router.push(`/dashboard/workflows/${data.data.id}/builder`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Create Workflow</h1>
          <Link href="/dashboard/workflows" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Workflow Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., LinkedIn Cold Outreach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this workflow do?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Workflow'}
            </button>
            <Link
              href="/dashboard/workflows"
              className="flex-1 px-6 py-3 border border-gray-300 text-black rounded-lg hover:border-black text-center font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-12 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
          <h3 className="font-semibold text-black mb-2">What is a Workflow?</h3>
          <p className="text-sm text-gray-700">
            A workflow is a sequence of automated steps that runs on a schedule or in response to events. You can send messages, wait for responses, create conditional branches, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
