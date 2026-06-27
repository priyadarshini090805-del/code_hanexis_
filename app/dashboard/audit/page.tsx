'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  status: string;
  createdAt: string;
  details?: Record<string, any>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch(
        `/api/audit/logs${filter !== 'ALL' ? `?action=${filter}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setLogs(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-neutral-100 text-neutral-800';
      case 'UPDATE':
        return 'bg-neutral-100 text-neutral-800';
      case 'DELETE':
        return 'bg-neutral-100 text-neutral-800';
      case 'READ':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' ? 'text-neutral-600' : 'text-neutral-600';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Audit Logs</h1>
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

        <div className="mb-6 flex gap-2">
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'READ'].map(action => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === action
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-black hover:border-black'
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading audit logs...</p>
        ) : logs.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Action</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Resource</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{log.resource}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">No audit logs</p>
        )}
      </div>
    </div>
  );
}
