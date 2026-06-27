'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  stepsCount: number;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/workflows', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch workflows');

      const data = await response.json();
      setWorkflows(data.data?.workflows || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading workflows...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Workflows</h1>
          <Link
            href="/dashboard/workflows/new"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Create Workflow
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {filteredWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No workflows yet</p>
            <Link
              href="/dashboard/workflows/new"
              className="text-black hover:underline"
            >
              Create your first workflow
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredWorkflows.map(workflow => (
              <div
                key={workflow.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-black transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">{workflow.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      workflow.isActive
                        ? 'bg-neutral-100 text-neutral-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {workflow.description && (
                  <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{workflow.stepsCount} steps</span>
                  <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                </div>

                <Link
                  href={`/dashboard/workflows/${workflow.id}`}
                  className="inline-block px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
