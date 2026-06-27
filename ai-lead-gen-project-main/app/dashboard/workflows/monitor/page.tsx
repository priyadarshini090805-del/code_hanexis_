'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  campaignId: string;
  leadId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  currentStep?: number;
  totalSteps?: number;
}

export default function WorkflowMonitorPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchExecutions();
    const interval = setInterval(() => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchExecutions();
    }, 5000);

    return () => clearInterval(interval);
  }, [filter]);

  const fetchExecutions = async () => {
    try {
      const token = 'cookie';
      const response = await fetch(
        `/api/workflows/executions?status=${filter === 'ALL' ? '' : filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch executions');
      const data = await response.json();
      setExecutions(data.data || []);
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
      case 'FAILED':
        return 'bg-neutral-100 text-neutral-800';
      case 'PAUSED':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Workflow Executions</h1>
          <Link href="/dashboard/workflows" className="text-gray-600 hover:text-black">
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

        <div className="mb-6 flex gap-2">
          {['ALL', 'RUNNING', 'COMPLETED', 'FAILED'].map(status => (
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
          <p className="text-center text-gray-500">Loading executions...</p>
        ) : executions.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Execution ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Progress</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Started</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Duration</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(e => {
                  const duration =
                    e.completedAt
                      ? Math.round((new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
                      : Math.round((Date.now() - new Date(e.startedAt).getTime()) / 1000);

                  return (
                    <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black font-mono">{e.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {e.currentStep}/{e.totalSteps} steps
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(e.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{duration}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No workflow executions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
