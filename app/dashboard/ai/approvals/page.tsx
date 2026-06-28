'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Generation {
  id: string;
  messageType: string;
  tone: string;
  length: string;
  response: string;
  approvalStatus: string;
  approvedMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  lead: { id: string; firstName: string; lastName: string; company: string | null; jobTitle: string | null; email: string };
}

interface Summary { PENDING: number; APPROVED: number; REJECTED: number; SENT: number }

const TYPE_LABELS: Record<string, string> = {
  CONNECTION_MESSAGE: 'Connection',
  FOLLOWUP_MESSAGE: 'Follow-up',
  SALES_PITCH: 'Sales Pitch',
  COLD_OUTREACH: 'Cold Outreach',
  CALL_INVITATION: 'Call Invite',
  REENGAGEMENT: 'Re-engagement',
};

export default function ApprovalsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [summary, setSummary] = useState<Summary>({ PENDING: 0, APPROVED: 0, REJECTED: 0, SENT: 0 });
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchApprovals(); }, [statusFilter]);

  async function fetchApprovals() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/approvals?status=${statusFilter}`, { credentials: 'same-origin' });
      const data = await res.json();
      setGenerations(data.data?.generations || []);
      setSummary(data.data?.summary || { PENDING: 0, APPROVED: 0, REJECTED: 0, SENT: 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleApprove(id: string, editedMessage?: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/ai/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ editedMessage }),
      });
      if (res.ok) { setEditingId(null); fetchApprovals(); }
    } finally { setActionLoading(null); }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/ai/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) { setRejectingId(null); setRejectReason(''); fetchApprovals(); }
    } finally { setActionLoading(null); }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]',
    APPROVED: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]',
    REJECTED: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]',
    SENT: 'bg-[var(--hx-surface-secondary)] text-[var(--hx-text)]',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--hx-text)]">Message Approvals</h1>
            <p className="text-sm text-[var(--hx-text-secondary)] mt-0.5">Review AI-generated messages before they&apos;re sent</p>
          </div>
          <Link href="/dashboard/ai" className="text-sm text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">← AI Generator</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {(['PENDING', 'APPROVED', 'REJECTED', 'SENT'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                statusFilter === s ? 'border-black hx-btn-primary' : 'border-[var(--hx-border)] hover:border-gray-400'
              }`}
            >
              <p className={`text-2xl font-bold ${statusFilter === s ? 'text-white' : 'text-black'}`}>{summary[s]}</p>
              <p className={`text-xs mt-1 uppercase tracking-wider ${statusFilter === s ? 'text-gray-300' : 'text-[var(--hx-text-secondary)]'}`}>{s}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : generations.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[var(--hx-border)] rounded-xl">
            <p className="text-[var(--hx-text-secondary)] text-lg">No {statusFilter.toLowerCase()} messages</p>
            <Link href="/dashboard/ai" className="mt-3 inline-block text-sm text-[var(--hx-text)] underline">Generate a message →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <div key={gen.id} className="border border-[var(--hx-border)] rounded-xl p-5 bg-[var(--hx-surface)]">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--hx-text)]">
                        {gen.lead.firstName} {gen.lead.lastName}
                      </span>
                      {gen.lead.company && <span className="text-sm text-[var(--hx-text-secondary)]">@ {gen.lead.company}</span>}
                      {gen.lead.jobTitle && <span className="text-xs text-gray-400">· {gen.lead.jobTitle}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-[var(--hx-surface-secondary)] text-[var(--hx-text-secondary)] px-2 py-0.5 rounded">
                        {TYPE_LABELS[gen.messageType] || gen.messageType}
                      </span>
                      <span className="text-xs text-gray-400">{gen.tone} · {gen.length}</span>
                      <span className="text-xs text-gray-400">{new Date(gen.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[gen.approvalStatus]}`}>
                    {gen.approvalStatus}
                  </span>
                </div>

                {/* Message */}
                {editingId === gen.id ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={8}
                    className="w-full text-sm text-[var(--hx-text)] border border-[var(--hx-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)] resize-none"
                  />
                ) : (
                  <div className="bg-[var(--hx-surface-secondary)] rounded-lg p-4 text-sm text-[var(--hx-text)] whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {gen.approvedMessage || gen.response}
                  </div>
                )}

                {/* Rejection reason */}
                {gen.approvalStatus === 'REJECTED' && gen.rejectionReason && (
                  <p className="mt-2 text-xs text-[var(--hx-text-secondary)]">Reason: {gen.rejectionReason}</p>
                )}

                {/* Reject reason input */}
                {rejectingId === gen.id && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                  </div>
                )}

                {/* Actions — only for PENDING */}
                {gen.approvalStatus === 'PENDING' && (
                  <div className="flex gap-2 mt-4">
                    {editingId === gen.id ? (
                      <>
                        <button
                          onClick={() => handleApprove(gen.id, editText)}
                          disabled={actionLoading === gen.id}
                          className="flex-1 px-4 py-2 hx-btn-primary text-sm rounded-lg font-medium hover:bg-[var(--hx-brand-light)] disabled:opacity-50"
                        >
                          {actionLoading === gen.id ? 'Approving...' : '✓ Approve with Edits'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-[var(--hx-border)] text-sm rounded-lg text-[var(--hx-text-secondary)] hover:bg-[var(--hx-surface-secondary)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : rejectingId === gen.id ? (
                      <>
                        <button
                          onClick={() => handleReject(gen.id)}
                          disabled={actionLoading === gen.id}
                          className="flex-1 px-4 py-2 bg-neutral-600 text-white text-sm rounded-lg font-medium hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {actionLoading === gen.id ? 'Rejecting...' : '✗ Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 border border-[var(--hx-border)] text-sm rounded-lg text-[var(--hx-text-secondary)] hover:bg-[var(--hx-surface-secondary)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(gen.id)}
                          disabled={actionLoading === gen.id}
                          className="flex-1 px-4 py-2 hx-btn-primary text-sm rounded-lg font-medium hover:bg-[var(--hx-brand-light)] disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => { setEditingId(gen.id); setEditText(gen.response); }}
                          className="px-4 py-2 border border-[var(--hx-border)] text-sm rounded-lg text-[var(--hx-text-secondary)] hover:bg-[var(--hx-surface-secondary)]"
                        >
                          ✎ Edit & Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(gen.id)}
                          className="px-4 py-2 border border-[var(--hx-border)] text-[var(--hx-text-secondary)] text-sm rounded-lg hover:bg-[var(--hx-surface-secondary)]"
                        >
                          ✗ Reject
                        </button>
                        <Link
                          href={`/dashboard/leads/${gen.lead.id}`}
                          className="px-4 py-2 border border-[var(--hx-border)] text-[var(--hx-text-secondary)] text-sm rounded-lg hover:bg-[var(--hx-surface-secondary)]"
                        >
                          View Lead
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
