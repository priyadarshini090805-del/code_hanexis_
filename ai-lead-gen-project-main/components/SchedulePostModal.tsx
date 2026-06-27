'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onScheduled: () => void;
}

export default function SchedulePostModal({ onClose, onScheduled }: Props) {
  const [platform, setPlatform] = useState('linkedin');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generateWithAI = async () => {
    if (!topic.trim()) { setError('Enter a topic for AI generation'); return; }
    setGenerating(true); setError('');
    try {
      const token = 'cookie';
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: platform === 'instagram' ? 'INSTAGRAM_CAPTION' : 'LINKEDIN_POST',
          topic,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setContent(data.data?.content || data.content || '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const schedule = async () => {
    if (!content.trim() || !scheduledFor) { setError('Content and schedule time are required'); return; }
    if (platform === 'instagram' && !imageUrl.trim()) { setError('Instagram posts require an image URL'); return; }
    setSaving(true); setError('');
    try {
      const token = 'cookie';
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          platform,
          content,
          imageUrl: imageUrl || undefined,
          scheduledFor: new Date(scheduledFor).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          title: topic || content.slice(0, 60),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scheduling failed');
      onScheduled();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-black">Schedule a Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black">
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div className="border border-neutral-200 bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-neutral-900">✨ Generate with AI</div>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Topic (e.g. AI in sales prospecting)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm" />
            <div className="flex gap-2">
              <select value={tone} onChange={e => setTone(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-black text-sm">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="consultative">Consultative</option>
                <option value="direct">Direct</option>
              </select>
              <button onClick={generateWithAI} disabled={generating}
                className="flex-1 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 text-sm font-medium disabled:opacity-50">
                {generating ? 'Generating…' : 'Generate content'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
              placeholder="Write your post or generate it with AI above…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm" />
          </div>

          {platform === 'instagram' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (required for Instagram)</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publish at</label>
            <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm" />
          </div>

          <button onClick={schedule} disabled={saving}
            className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50">
            {saving ? 'Scheduling…' : 'Schedule post'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            The post publishes automatically at the scheduled time via your connected account.
          </p>
        </div>
      </div>
    </div>
  );
}
