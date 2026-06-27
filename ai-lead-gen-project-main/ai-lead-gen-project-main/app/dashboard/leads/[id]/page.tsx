'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Activity {
  id: string;
  activityType: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  title?: string;
  location?: string;
  status: string;
  score?: number;
  notes?: string;
  tags?: Array<{ id: string; name: string; color: string } | string>;
  activities: Activity[];
  createdAt: string;
  updatedAt?: string;
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-neutral-100 text-neutral-700',
  RESPONDED: 'bg-neutral-100 text-neutral-700',
  QUALIFIED: 'bg-neutral-100 text-neutral-700',
  CONVERTED: 'bg-neutral-100 text-neutral-700',
  LOST: 'bg-neutral-100 text-neutral-700',
};

// ── Activity type → icon/colour map ───────────────────────────────────────────
const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  EMAIL_SENT: { icon: '✉', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Email Sent' },
  EMAIL_OPENED: { icon: '👁', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Email Opened' },
  EMAIL_REPLIED: { icon: '↩', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Email Replied' },
  LINKEDIN_MESSAGE: { icon: 'in', color: 'text-neutral-700', bg: 'bg-neutral-50', label: 'LinkedIn Message' },
  LINKEDIN_CONNECTED: { icon: '🤝', color: 'text-neutral-700', bg: 'bg-neutral-50', label: 'LinkedIn Connected' },
  INSTAGRAM_MESSAGE: { icon: '📸', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Instagram Message' },
  CALL_MADE: { icon: '📞', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Call Made' },
  CALL_SCHEDULED: { icon: '📅', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Call Scheduled' },
  NOTE_ADDED: { icon: '📝', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Note Added' },
  STATUS_CHANGED: { icon: '⟳', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Status Changed' },
  TAG_ADDED: { icon: '🏷', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Tag Added' },
  TAG_REMOVED: { icon: '✂', color: 'text-neutral-500', bg: 'bg-neutral-50', label: 'Tag Removed' },
  AI_MESSAGE_GENERATED: { icon: '✨', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'AI Message Generated' },
  CAMPAIGN_ENROLLED: { icon: '🚀', color: 'text-neutral-600', bg: 'bg-neutral-50', label: 'Campaign Enrolled' },
  LEAD_CREATED: { icon: '➕', color: 'text-neutral-700', bg: 'bg-neutral-50', label: 'Lead Created' },
};

function getActivityConfig(type: string) {
  return ACTIVITY_CONFIG[type] || { icon: '•', color: 'text-gray-500', bg: 'bg-gray-50', label: type };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'ai'>('timeline');

  useEffect(() => { if (id) fetchLead(); }, [id]);

  async function fetchLead() {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${id}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Lead not found');
      const data = await res.json();
      setLead(data.data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function addTag() {
    if (!newTag.trim()) return;
    try {
      await fetch(`/api/leads/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tag: newTag, action: 'add' }),
      });
      setNewTag(''); fetchLead();
    } catch (err: any) { setError(err.message); }
  }

  async function removeTag(tag: string) {
    try {
      await fetch(`/api/leads/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tag, action: 'remove' }),
      });
      fetchLead();
    } catch (err: any) { setError(err.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading lead...</div>;
  if (!lead) return (
    <div className="p-8 text-center">
      <p className="text-neutral-600 mb-4">{error || 'Lead not found'}</p>
      <Link href="/dashboard/leads" className="text-sm text-gray-500 hover:text-black">← Back to leads</Link>
    </div>
  );

  const tagNames = (lead.tags || []).map((t) => typeof t === 'string' ? t : t.name);
  const activities = lead.activities || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                {lead.firstName?.[0]}{lead.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">{lead.firstName} {lead.lastName}</h1>
                {(lead.jobTitle || lead.title) && lead.company && (
                  <p className="text-sm text-gray-500">{lead.jobTitle || lead.title} @ {lead.company}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-700'}`}>
                {lead.status}
              </span>
              {lead.score !== undefined && (
                <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                  Score: {lead.score}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/ai?leadId=${lead.id}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              ✨ Generate Message
            </Link>
            <Link href="/dashboard/leads" className="text-sm text-gray-500 hover:text-black">← Back</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {error && <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-4 text-sm text-neutral-700">{error}</div>}

        <div className="grid grid-cols-3 gap-6">
          {/* Left column — contact info + tags */}
          <div className="col-span-1 space-y-4">
            {/* Contact info */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-black mb-3">Contact</h3>
              <dl className="space-y-2">
                {[
                  { label: 'Email', value: lead.email },
                  { label: 'Phone', value: lead.phone },
                  { label: 'Company', value: lead.company },
                  { label: 'Job Title', value: lead.jobTitle || lead.title },
                  { label: 'Location', value: lead.location },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs text-gray-400">{f.label}</dt>
                    <dd className="text-sm text-black break-words">{f.value}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs text-gray-400">Added</dt>
                  <dd className="text-sm text-black">{new Date(lead.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-black mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tagNames.length === 0 && <p className="text-xs text-gray-400">No tags yet</p>}
                {tagNames.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-neutral-500 leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tag..."
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button onClick={addTag} className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-900">
                  +
                </button>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-black mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {/* Quick links */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-black mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/ai?leadId=${lead.id}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black p-2 rounded-lg hover:bg-gray-50">
                  <span>✨</span> Generate AI Message
                </Link>
                <Link href={`/dashboard/campaigns`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black p-2 rounded-lg hover:bg-gray-50">
                  <span>🚀</span> Add to Campaign
                </Link>
                <Link href={`/dashboard/conversations`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black p-2 rounded-lg hover:bg-gray-50">
                  <span>💬</span> View Conversations
                </Link>
              </div>
            </div>
          </div>

          {/* Right column — activity timeline */}
          <div className="col-span-2">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="font-semibold text-black">Activity Timeline</h2>
                <span className="text-xs text-gray-400">{activities.length} events</span>
              </div>

              {activities.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-400 text-sm">No activity recorded yet</p>
                  <p className="text-xs text-gray-300 mt-1">Actions like sending messages or enrolling in campaigns will appear here</p>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />

                    <div className="space-y-5">
                      {activities
                        .slice()
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((activity, i) => {
                          const cfg = getActivityConfig(activity.activityType);
                          return (
                            <div key={activity.id} className="relative flex gap-4 pl-1">
                              {/* Icon node */}
                              <div className={`relative z-10 w-9 h-9 rounded-full ${cfg.bg} border-2 border-white shadow-sm flex items-center justify-center text-base shrink-0`}>
                                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.icon}</span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className="text-sm font-semibold text-black">{cfg.label}</p>
                                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(activity.createdAt)}</span>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                                )}
                                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                  <div className="mt-1.5 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-0.5">
                                    {Object.entries(activity.metadata).slice(0, 3).map(([k, v]) => (
                                      <div key={k} className="flex gap-2">
                                        <span className="text-gray-400 capitalize">{k}:</span>
                                        <span className="text-gray-700 truncate">{String(v)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-gray-300 mt-1">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
