'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QueueMetrics {
  name: string;
  count: number;
  failed: number;
  delayed: number;
  active: number;
  paused: number;
  completed: number;
}

export default function QueueMonitorPage() {
  const [queues, setQueues] = useState<QueueMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchQueues();
    const interval = setInterval(() => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchQueues();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/queue/metrics', {
      });

      if (!response.ok) throw new Error('Failed to fetch queue metrics');
      const data = await response.json();
      setQueues(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (failed: number, total: number) => {
    if (failed === 0) return { color: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]', text: 'Healthy' };
    if (failed < total * 0.1) return { color: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]', text: 'Warning' };
    return { color: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]', text: 'Critical' };
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">Queue Monitoring</h1>
          <Link href="/dashboard" className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-[var(--hx-surface-secondary)] border border-[var(--hx-border)] rounded-lg mb-6">
            <p className="text-[var(--hx-text)]">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center text-[var(--hx-text-secondary)]">Loading queue metrics...</p>
        ) : queues.length > 0 ? (
          <div className="space-y-6">
            {queues.map(q => {
              const total = q.count + q.failed;
              const health = getHealthStatus(q.failed, total);
              const activePercent = total > 0 ? (q.active / total) * 100 : 0;

              return (
                <div key={q.name} className="border border-[var(--hx-border)] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--hx-text)]">{q.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${health.color}`}>
                      {health.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-4 mb-6">
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text-secondary)]">Total</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.count}</p>
                    </div>
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text)]">Active</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.active}</p>
                    </div>
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text)]">Delayed</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.delayed}</p>
                    </div>
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text)]">Paused</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.paused}</p>
                    </div>
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text)]">Completed</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.completed}</p>
                    </div>
                    <div className="bg-[var(--hx-surface-secondary)] p-3 rounded">
                      <p className="text-xs text-[var(--hx-text)]">Failed</p>
                      <p className="text-2xl font-bold text-[var(--hx-text)]">{q.failed}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--hx-text)]">Processing Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-neutral-600 h-2 rounded-full transition-all"
                        style={{ width: `${activePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--hx-text-secondary)]">{activePercent.toFixed(1)}% processing</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-[var(--hx-text-secondary)]">No queue data available</p>
        )}
      </div>
    </div>
  );
}
