'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScheduledItem {
  id: string;
  title: string;
  body: string;
  platform: string;
  status: string;
  approvalStatus: string;
  approvalNotes: string | null;
  scheduledFor: string | null;
  createdAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  LINKEDIN: 'bg-neutral-600',
  TWITTER: 'bg-neutral-400',
  INSTAGRAM: 'bg-neutral-500',
  FACEBOOK: 'bg-neutral-600',
};

export default function ContentApprovalsPage() {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchItems(); }, [filter]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scheduler?approvalStatus=${filter}&limit=50`, { credentials: 'same-origin' });
      const data = await res.json();
      setItems(data.data?.scheduled || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function approve(id: string) {
    setActionId(id);
    try {
      await fetch(`/api/scheduler/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ notes }),
      });
      setNotesId(null); setNotes(''); fetchItems();
    } finally { setActionId(null); }
  }

  async function reject(id: string) {
    setActionId(id);
    try {
      await fetch(`/api/scheduler/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ notes }),
      });
      setNotesId(null); setNotes(''); fetchItems();
    } finally { setActionId(null); }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Content Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review scheduled posts before they go live</p>
        </div>
        <Link href="/dashboard/scheduler" className="text-sm text-gray-500 hover:text-black">← Scheduler</Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                filter === s ? 'bg-black text-white' : 'border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400">No {filter.toLowerCase()} content</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs text-white px-2 py-0.5 rounded ${PLATFORM_COLORS[item.platform.toUpperCase()] || 'bg-gray-400'}`}>
                        {item.platform}
                      </span>
                      <span className="text-sm font-semibold text-black">{item.title}</span>
                    </div>
                    {item.scheduledFor && (
                      <p className="text-xs text-gray-500 mt-1">
                        Scheduled: {new Date(item.scheduledFor).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.approvalStatus === 'APPROVED' ? 'bg-neutral-100 text-neutral-800' :
                    item.approvalStatus === 'REJECTED' ? 'bg-neutral-100 text-neutral-800' :
                    'bg-neutral-100 text-neutral-800'
                  }`}>
                    {item.approvalStatus}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-black whitespace-pre-wrap max-h-40 overflow-y-auto mb-3">
                  {item.body}
                </div>

                {item.approvalNotes && (
                  <p className="text-xs text-gray-500 mb-3">Notes: {item.approvalNotes}</p>
                )}

                {notesId === item.id && (
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}

                {item.approvalStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    {notesId === item.id ? (
                      <>
                        <button
                          onClick={() => approve(item.id)}
                          disabled={actionId === item.id}
                          className="flex-1 px-4 py-2 bg-neutral-600 text-white text-sm rounded-lg font-medium hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {actionId === item.id ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => reject(item.id)}
                          disabled={actionId === item.id}
                          className="flex-1 px-4 py-2 bg-neutral-600 text-white text-sm rounded-lg font-medium hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {actionId === item.id ? '...' : '✗ Reject'}
                        </button>
                        <button
                          onClick={() => { setNotesId(null); setNotes(''); }}
                          className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => approve(item.id)}
                          disabled={actionId === item.id}
                          className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => { setNotesId(item.id); setNotes(''); }}
                          className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                          Add Notes
                        </button>
                        <button
                          onClick={() => reject(item.id)}
                          className="px-4 py-2 border border-neutral-200 text-neutral-600 text-sm rounded-lg hover:bg-neutral-50"
                        >
                          ✗ Reject
                        </button>
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
