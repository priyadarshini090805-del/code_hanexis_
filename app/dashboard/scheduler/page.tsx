'use client';

import { useEffect, useState } from 'react';
import SchedulePostModal from '@/components/SchedulePostModal';

interface ScheduledContent {
  id: string;
  title: string;
  platform: string;
  scheduledFor: string;
  status: string;
  content?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  LINKEDIN: 'bg-neutral-600',
  TWITTER: 'bg-neutral-400',
  INSTAGRAM: 'bg-neutral-500',
  FACEBOOK: 'bg-neutral-600',
};
const PLATFORM_LABELS: Record<string, string> = {
  LINKEDIN: 'LI',
  TWITTER: 'TW',
  INSTAGRAM: 'IG',
  FACEBOOK: 'FB',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-800',
  PUBLISHED: 'bg-neutral-100 text-neutral-800',
  FAILED: 'bg-neutral-100 text-neutral-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-neutral-100 text-neutral-800',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SchedulerPage() {
  const [scheduled, setScheduled] = useState<ScheduledContent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => { fetchScheduled(); }, [currentMonth]);

  async function fetchScheduled() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/scheduler?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`,
        { credentials: 'same-origin' }
      );
      const data = await res.json();
      setScheduled(data.data?.scheduled || []);
      setStats(data.data?.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();

  // Build day → items map
  const dayMap: Record<number, ScheduledContent[]> = {};
  scheduled.forEach((item) => {
    const d = new Date(item.scheduledFor);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(item);
    }
  });

  const selectedItems = selectedDay ? (dayMap[selectedDay] || []) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Content Scheduler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan and manage your social media posts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm ${view === 'calendar' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm border-l border-gray-200 ${view === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            + Schedule Post
          </button>
        </div>
      </div>

      {showModal && (
        <SchedulePostModal onClose={() => setShowModal(false)} onScheduled={fetchScheduled} />
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Pending', value: stats.pending, color: 'text-neutral-600' },
              { label: 'Published', value: stats.published, color: 'text-neutral-600' },
              { label: 'Failed', value: stats.failed || 0, color: 'text-neutral-600' },
              { label: 'Total', value: stats.total, color: 'text-black' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'calendar' ? (
          <div className="grid grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="col-span-2 border border-gray-200 rounded-xl p-5">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-black">
                  {MONTHS[month]} {year}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCurrentMonth(new Date(year, month - 1)); setSelectedDay(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-black text-gray-600 hover:text-black"
                  >
                    &#8249;
                  </button>
                  <button
                    onClick={() => { setCurrentMonth(new Date()); setSelectedDay(null); }}
                    className="px-3 h-8 text-xs rounded-lg border border-gray-200 hover:border-black text-gray-600 hover:text-black"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => { setCurrentMonth(new Date(year, month + 1)); setSelectedDay(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-black text-gray-600 hover:text-black"
                  >
                    &#8250;
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
              ) : (
                <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`pre-${i}`} className="bg-white min-h-24 p-1" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const items = dayMap[day] || [];
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    const isSelected = selectedDay === day;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`bg-white min-h-24 p-1.5 cursor-pointer transition-colors ${
                          isSelected ? 'ring-2 ring-black ring-inset' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                          isToday ? 'bg-black text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className={`text-white text-xs rounded px-1 py-0.5 truncate ${PLATFORM_COLORS[item.platform] || 'bg-gray-400'}`}
                            >
                              {PLATFORM_LABELS[item.platform] || '?'} {item.title}
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="text-xs text-gray-400 pl-1">+{items.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(() => {
                    const totalCells = firstDayOfMonth + daysInMonth;
                    const remainder = totalCells % 7;
                    const trailing = remainder === 0 ? 0 : 7 - remainder;
                    return Array.from({ length: trailing }).map((_, i) => (
                      <div key={`post-${i}`} className="bg-white min-h-24 p-1" />
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="col-span-1 space-y-4">
              {selectedDay ? (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-black mb-3">
                    {MONTHS[month]} {selectedDay}, {year}
                  </h3>
                  {selectedItems.length === 0 ? (
                    <p className="text-sm text-gray-400">No posts scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs text-white px-1.5 py-0.5 rounded ${PLATFORM_COLORS[item.platform] || 'bg-gray-400'}`}>
                              {item.platform}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-black">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400">Click a day to see posts</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-black mb-3">Upcoming Posts</h3>
                <div className="space-y-2">
                  {scheduled
                    .filter((s) => new Date(s.scheduledFor) >= new Date() && s.status === 'PENDING')
                    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                    .slice(0, 6)
                    .map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className={`text-xs text-white px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${PLATFORM_COLORS[item.platform] || 'bg-gray-400'}`}>
                          {PLATFORM_LABELS[item.platform]}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-black truncate max-w-[160px]">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {' '}
                            {new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  {scheduled.filter((s) => new Date(s.scheduledFor) >= new Date() && s.status === 'PENDING').length === 0 && (
                    <p className="text-xs text-gray-400">No upcoming posts</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div>Title</div><div>Platform</div><div>Scheduled</div><div>Status</div><div></div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : scheduled.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No posts this month</div>
            ) : (
              scheduled.map((item) => (
                <div key={item.id} className="grid grid-cols-5 gap-4 px-4 py-3 border-t border-gray-100 hover:bg-gray-50">
                  <div className="text-sm font-medium text-black truncate">{item.title}</div>
                  <div>
                    <span className={`text-xs text-white px-2 py-0.5 rounded ${PLATFORM_COLORS[item.platform] || 'bg-gray-400'}`}>
                      {item.platform}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(item.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div></div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
