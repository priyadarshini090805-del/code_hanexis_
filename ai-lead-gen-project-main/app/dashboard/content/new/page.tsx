'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const contentTypes = [
  { value: 'LINKEDIN_POST', label: 'LinkedIn Post', icon: '💼' },
  { value: 'INSTAGRAM_CAPTION', label: 'Instagram Caption', icon: '📷' },
  { value: 'POSTER', label: 'Poster', icon: '🎨' },
  { value: 'VIDEO_SCRIPT', label: 'Video Script', icon: '🎬' },
  { value: 'JOB_POST', label: 'Job Post', icon: '🏢' },
  { value: 'COMPANY_ANNOUNCEMENT', label: 'Announcement', icon: '📢' },
];

const aiPrompts: Record<string, string> = {
  LINKEDIN_POST: 'Generate a professional LinkedIn post about {{topic}}',
  INSTAGRAM_CAPTION: 'Generate an engaging Instagram caption about {{topic}}',
  POSTER: 'Generate poster copy for {{topic}}',
  VIDEO_SCRIPT: 'Generate a short video script about {{topic}}',
  JOB_POST: 'Generate a job posting for {{position}}',
  COMPANY_ANNOUNCEMENT: 'Generate a company announcement about {{topic}}',
};

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'LINKEDIN_POST',
    title: '',
    body: '',
    aiGenerated: false,
  });
  const [aiInput, setAiInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = 'cookie';

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create content');
      }

      const data = await response.json();
      router.push(`/dashboard/content/${data.data.content.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiInput.trim()) {
      setError('Please enter a topic or details');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const token = 'cookie';

      const prompt = aiPrompts[formData.type].replace('{{topic}}', aiInput).replace('{{position}}', aiInput);

      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadId: 'system', // Fake lead ID for content generation
          messageType: 'SALES_PITCH',
          tone: 'PROFESSIONAL',
          length: 'MEDIUM',
          productName: formData.type,
          valueProposition: prompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate content');
      const data = await response.json();

      setFormData({
        ...formData,
        body: data.data.message,
        aiGenerated: true,
      });
      setAiInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard/content" className="text-gray-600 hover:text-black mb-4 inline-block">
          ← Back to Content
        </Link>

        <h1 className="text-3xl font-bold text-black mb-8">Create Content</h1>

        {error && (
          <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-3">Content Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.type === type.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-black hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Content title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-black">Content *</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, body: formData.body + '\n\n' })}
                className="text-sm text-gray-600 hover:text-black"
              >
                ➕ Add line
              </button>
            </div>
            <textarea
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              placeholder="Write your content here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">{formData.body.length} characters</div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-black mb-3">🤖 Generate with AI</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={`Describe what you want (e.g., "cloud computing" for a LinkedIn post)`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={generateWithAI}
                disabled={generating || !aiInput}
                className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Content'}
            </button>
            <Link
              href="/dashboard/content"
              className="px-6 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
