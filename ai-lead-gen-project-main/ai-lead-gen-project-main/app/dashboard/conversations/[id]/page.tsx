'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'lead';
  content: string;
  isAiSuggested?: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  platform?: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    jobTitle?: string;
  };
  messages: Message[];
}

// Fixed AI suggestions per context (no API call needed for quick responses)
const AI_QUICK_REPLIES = [
  "That sounds great! When would you be available for a quick call?",
  "I'd love to learn more about your current challenges. Could you share more?",
  "Happy to help! What are your main priorities right now?",
  "Thanks for your interest. Let me send you more details.",
  "Would it make sense to schedule a 15-minute demo this week?",
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function groupByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) { last.messages.push(msg); }
    else { groups.push({ date, messages: [msg] }); }
  });
  return groups;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchConversation(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation?.messages]);

  async function fetchConversation() {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${id}/messages`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Conversation not found');
      const data = await res.json();
      setConversation(data.data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function sendMessage(content?: string) {
    const text = (content || input).trim();
    if (!text) return;

    // Optimistically add message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: text,
      isAiSuggested: !!content,
      createdAt: new Date().toISOString(),
    };
    setConversation((prev) => prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sender: 'user', content: text }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      // Replace temp with real
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages.filter((m) => m.id !== tempMsg.id), data.data],
        };
      });
    } catch (err: any) {
      setError(err.message);
      // Remove optimistic message on error
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempMsg.id) } : prev
      );
    } finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!conversation) return (
    <div className="p-8 text-center">
      <p className="text-neutral-600">{error || 'Conversation not found'}</p>
      <Link href="/dashboard/conversations" className="text-sm text-gray-500 mt-2 inline-block">← Back</Link>
    </div>
  );

  const grouped = groupByDate(conversation.messages);
  const lead = conversation.lead;
  const initials = lead ? `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}` : '?';

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left sidebar — lead info + AI suggestions */}
      <div className="w-72 border-r border-gray-200 flex flex-col shrink-0">
        {/* Lead header */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/dashboard/conversations" className="text-xs text-gray-400 hover:text-black mb-3 flex items-center gap-1">
            ← All conversations
          </Link>
          {lead && (
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-black text-sm truncate">{lead.firstName} {lead.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                {lead.company && <p className="text-xs text-gray-400 truncate">{lead.company}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Lead quick links */}
        {lead && (
          <div className="px-4 py-3 border-b border-gray-100">
            <Link href={`/dashboard/leads/${lead.id}`}
              className="text-xs text-neutral-600 hover:text-neutral-800 flex items-center gap-1">
              View Lead Profile →
            </Link>
          </div>
        )}

        {/* AI Suggestions panel */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">✨ AI Replies</h3>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-gray-400 hover:text-black"
            >
              {showSuggestions ? 'hide' : 'show'}
            </button>
          </div>

          {showSuggestions && (
            <div className="space-y-2">
              {AI_QUICK_REPLIES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs p-2.5 bg-neutral-50 text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors border border-neutral-100"
                >
                  {s}
                </button>
              ))}
              <Link
                href={lead ? `/dashboard/ai?leadId=${lead.id}` : '/dashboard/ai'}
                className="block text-xs text-center text-gray-500 hover:text-black mt-2 py-2 border border-dashed border-gray-200 rounded-lg"
              >
                Generate custom message →
              </Link>
            </div>
          )}
        </div>

        {/* Platform badge */}
        {conversation.platform && (
          <div className="px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">via <span className="font-medium text-gray-600">{conversation.platform}</span></span>
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-black">
                {lead ? `${lead.firstName} ${lead.lastName}` : 'Unknown'}
              </p>
              <p className="text-xs text-gray-400">{conversation.messages.length} messages</p>
            </div>
          </div>
          <div className="flex gap-2">
            {lead && (
              <Link href={`/dashboard/ai?leadId=${lead.id}`}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                ✨ Generate
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-xs text-gray-300 mt-1">Use an AI suggestion on the left or type below</p>
              </div>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender === 'user';
                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                            {initials}
                          </div>
                        )}
                        <div className={`max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? `bg-black text-white rounded-tr-sm ${msg.isAiSuggested ? 'ring-2 ring-neutral-400 ring-offset-1' : ''}`
                                : 'bg-gray-100 text-black rounded-tl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {msg.isAiSuggested && (
                              <span className="text-xs text-neutral-500">✨ AI</span>
                            )}
                            <span className="text-xs text-gray-300">{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                        {isMe && (
                          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                            You
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compose area */}
        <div className="border-t border-gray-200 px-5 py-4 shrink-0">
          {error && (
            <div className="mb-2 text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{ resize: 'none' }}
                className="w-full px-4 py-3 text-sm text-black focus:outline-none bg-white"
                onInput={(e) => {
                  const ta = e.currentTarget;
                  ta.style.height = 'auto';
                  ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="px-5 py-3 bg-black text-white text-sm rounded-xl hover:bg-gray-900 disabled:opacity-40 font-medium shrink-0"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-2 text-right">Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
