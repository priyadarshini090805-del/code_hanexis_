'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  NEW_LEAD: '🎯',
  POST_PUBLISHED: '✅',
  POST_FAILED: '⚠️',
  INTEGRATION: '🔗',
  SYSTEM: 'ℹ️',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const token = 'cookie';
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.data?.items || []);
      setUnread(data.data?.unreadCount || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    const token = 'cookie';
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  const openItem = async (n: Notification) => {
    const token = 'cookie';
    fetch(`/api/notifications/${n.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).then(load);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-neutral-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-black">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-neutral-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex gap-3 ${
                    !n.read ? 'bg-neutral-50/50' : ''
                  }`}
                >
                  <span className="text-lg shrink-0">{TYPE_ICONS[n.type] || '📌'}</span>
                  <div className="min-w-0">
                    <div className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-black truncate`}>
                      {n.title}
                    </div>
                    {n.body && <div className="text-xs text-gray-600 truncate">{n.body}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="ml-auto mt-1 w-2 h-2 bg-neutral-500 rounded-full shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
