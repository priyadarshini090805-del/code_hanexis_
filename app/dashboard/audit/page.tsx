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
      const response = await fetch(
        `/api/audit/logs${filter !== 'ALL' ? `?action=${filter}` : ''}`,
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
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'UPDATE':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'DELETE':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      case 'READ':
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
      default:
        return 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' ? 'text-[var(--hx-text-secondary)]' : 'text-[var(--hx-text-secondary)]';
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">Audit Logs</h1>
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

        <div className="mb-6 flex gap-2">
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'READ'].map(action => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === action
                  ? 'hx-btn-primary'
                  : 'border border-[var(--hx-border)] text-[var(--hx-text)] hover:border-black'
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-[var(--hx-text-secondary)]">Loading audit logs...</p>
        ) : logs.length > 0 ? (
          <div className="border border-[var(--hx-border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--hx-surface-secondary)] border-b border-[var(--hx-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Action</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Resource</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--hx-text)]">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-[var(--hx-border)] hover:bg-[var(--hx-surface-secondary)]">
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--hx-text)]">{log.resource}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--hx-text-secondary)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[var(--hx-text-secondary)]">No audit logs</p>
        )}
      </div>
    </div>
  );
}
