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
      const response = await fetch(
        `/api/workflows/executions?status=${filter === 'ALL' ? '' : filter}`,
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
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'COMPLETED':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'FAILED':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'PAUSED':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      default:
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">Workflow Executions</h1>
          <Link href="/dashboard/workflows" className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
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

        <div className="mb-6 flex gap-2">
          {['ALL', 'RUNNING', 'COMPLETED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'hx-btn-primary'
                  : 'border border-[var(--hx-border)] text-[var(--hx-text)] hover:border-black'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-[var(--hx-text-secondary)]">Loading executions...</p>
        ) : executions.length > 0 ? (
          <div className="border border-[var(--hx-border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--hx-surface-secondary)] border-b border-[var(--hx-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Execution ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Progress</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Started</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Duration</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(e => {
                  const duration =
                    e.completedAt
                      ? Math.round((new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
                      : Math.round((Date.now() - new Date(e.startedAt).getTime()) / 1000);

                  return (
                    <tr key={e.id} className="border-b border-[var(--hx-border)] hover:bg-[var(--hx-surface-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--hx-text)] font-mono">{e.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">
                        {e.currentStep}/{e.totalSteps} steps
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">
                        {new Date(e.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">{duration}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--hx-text-secondary)]">No workflow executions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
