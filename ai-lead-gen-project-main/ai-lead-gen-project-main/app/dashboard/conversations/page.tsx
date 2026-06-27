'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Conversation {
  id: string;
  leadId: string;
  platform: string;
  unreadCount: number;
  lastMessageAt: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter(c =>
    `${c.lead.firstName} ${c.lead.lastName} ${c.lead.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-black">Conversations</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading conversations...</p>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/conversations/${c.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-black">
                    {c.lead.firstName} {c.lead.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{c.lead.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">{c.platform}</p>
                  {c.unreadCount > 0 && (
                    <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded">
                      {c.unreadCount} new
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
