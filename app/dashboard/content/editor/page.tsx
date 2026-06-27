'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ContentEditorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'LINKEDIN_POST',
    tone: 'professional',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const contentTypes = [
    { value: 'LINKEDIN_POST', label: 'LinkedIn Post' },
    { value: 'INSTAGRAM_POST', label: 'Instagram Caption' },
    { value: 'JOB_POST', label: 'Job Post' },
    { value: 'VIDEO_SCRIPT', label: 'Video Script' },
    { value: 'SALES_EMAIL', label: 'Sales Email' },
    { value: 'COMPANY_ANNOUNCEMENT', label: 'Announcement' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'playful', label: 'Playful' },
  ];

  const generateWithAI = async () => {
    if (!formData.title) {
      setError('Please enter a topic');
      return;
    }

    try {
      setAiLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          topic: formData.title,
          tone: formData.tone,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const data = await response.json();
      setFormData({ ...formData, body: data.data?.content || '' });
      setSuggestions([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const saveContent = async () => {
    if (!formData.title || !formData.body) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      const token = 'cookie';
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          type: formData.type,
          tone: formData.tone,
        }),
      });

      if (!response.ok) throw new Error('Failed to save content');

      router.push('/dashboard/content');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Content Editor</h1>
          <Link href="/dashboard/content" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Topic / Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="What would you like to create about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Content Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {contentTypes.map(ct => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {tones.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-black">Content</label>
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading || !formData.title}
                  className="text-sm px-3 py-1 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200 disabled:opacity-50"
                >
                  {aiLoading ? 'Generating...' : '✨ Generate with AI'}
                </button>
              </div>
              <textarea
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                placeholder="Your content here..."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-2">{formData.body.length} characters</p>
            </div>

            <button
              onClick={saveContent}
              disabled={saving}
              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>

          <div className="col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 sticky top-8">
              <h3 className="font-semibold text-black mb-4">Preview</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-black mb-2">{formData.title || 'No title'}</p>
                <p className="text-xs bg-white p-2 rounded border border-gray-200 mb-4">
                  {formData.body.substring(0, 150) || 'Content preview will appear here...'}
                </p>
                <p className="text-xs text-gray-500">
                  Type: {contentTypes.find(ct => ct.value === formData.type)?.label}
                </p>
                <p className="text-xs text-gray-500">
                  Tone: {tones.find(t => t.value === formData.tone)?.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
