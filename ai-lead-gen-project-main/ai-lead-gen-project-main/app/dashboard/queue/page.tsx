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
      const token = 'cookie';
      const response = await fetch('/api/queue/metrics', {
        headers: { Authorization: `Bearer ${token}` },
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
    if (failed === 0) return { color: 'bg-neutral-100 text-neutral-800', text: 'Healthy' };
    if (failed < total * 0.1) return { color: 'bg-neutral-100 text-neutral-800', text: 'Warning' };
    return { color: 'bg-neutral-100 text-neutral-800', text: 'Critical' };
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Queue Monitoring</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-black">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading queue metrics...</p>
        ) : queues.length > 0 ? (
          <div className="space-y-6">
            {queues.map(q => {
              const total = q.count + q.failed;
              const health = getHealthStatus(q.failed, total);
              const activePercent = total > 0 ? (q.active / total) * 100 : 0;

              return (
                <div key={q.name} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">{q.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${health.color}`}>
                      {health.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-black">{q.count}</p>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <p className="text-xs text-neutral-800">Active</p>
                      <p className="text-2xl font-bold text-neutral-900">{q.active}</p>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <p className="text-xs text-neutral-800">Delayed</p>
                      <p className="text-2xl font-bold text-neutral-900">{q.delayed}</p>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <p className="text-xs text-neutral-800">Paused</p>
                      <p className="text-2xl font-bold text-neutral-900">{q.paused}</p>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <p className="text-xs text-neutral-800">Completed</p>
                      <p className="text-2xl font-bold text-neutral-900">{q.completed}</p>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <p className="text-xs text-neutral-800">Failed</p>
                      <p className="text-2xl font-bold text-neutral-900">{q.failed}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-black">Processing Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-neutral-600 h-2 rounded-full transition-all"
                        style={{ width: `${activePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{activePercent.toFixed(1)}% processing</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">No queue data available</p>
        )}
      </div>
    </div>
  );
}
