'use client';

import { useState } from 'react';
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
  const [, setSuggestions] = useState<string[]>([]);

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
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">Content Editor</h1>
          <Link href="/dashboard/content" className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-[var(--hx-surface-secondary)] border border-[var(--hx-border)] rounded-lg mb-6">
            <p className="text-[var(--hx-text)]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Topic / Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="What would you like to create about?"
                className="w-full px-4 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Content Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
                >
                  {contentTypes.map(ct => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
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
                <label className="block text-sm font-medium text-[var(--hx-text)]">Content</label>
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading || !formData.title}
                  className="text-sm px-3 py-1 bg-[var(--hx-surface-secondary)] text-[var(--hx-text)] rounded hover:bg-neutral-200 disabled:opacity-50"
                >
                  {aiLoading ? 'Generating...' : '✨ Generate with AI'}
                </button>
              </div>
              <textarea
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                placeholder="Your content here..."
                rows={12}
                className="w-full px-4 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)] font-mono text-sm"
              />
              <p className="text-sm text-[var(--hx-text-secondary)] mt-2">{formData.body.length} characters</p>
            </div>

            <button
              onClick={saveContent}
              disabled={saving}
              className="w-full px-6 py-3 hx-btn-primary rounded-lg hover:bg-[var(--hx-brand-light)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>

          <div className="col-span-1">
            <div className="bg-[var(--hx-surface-secondary)] rounded-lg p-4 sticky top-8">
              <h3 className="font-semibold text-[var(--hx-text)] mb-4">Preview</h3>
              <div className="text-sm text-[var(--hx-text-secondary)]">
                <p className="font-medium text-[var(--hx-text)] mb-2">{formData.title || 'No title'}</p>
                <p className="text-xs bg-[var(--hx-surface)] p-2 rounded border border-[var(--hx-border)] mb-4">
                  {formData.body.substring(0, 150) || 'Content preview will appear here...'}
                </p>
                <p className="text-xs text-[var(--hx-text-secondary)]">
                  Type: {contentTypes.find(ct => ct.value === formData.type)?.label}
                </p>
                <p className="text-xs text-[var(--hx-text-secondary)]">
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
