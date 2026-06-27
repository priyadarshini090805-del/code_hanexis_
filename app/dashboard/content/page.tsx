'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchContents();
  }, [filter]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/content', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      const filtered = filter === 'ALL' 
        ? data.data 
        : data.data.filter((c: ContentItem) => c.status === filter);
      setContents(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const token = 'cookie';
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete');
      fetchContents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Content Library</h1>
          <Link href="/dashboard/content/editor" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900">
            + New Content
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {['ALL', 'DRAFT', 'APPROVED', 'PUBLISHED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-black hover:border-black'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading content...</p>
        ) : contents.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-black">Created</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.map(c => (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === 'PUBLISHED' ? 'bg-neutral-100 text-neutral-800' :
                        c.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        c.status === 'APPROVED' ? 'bg-neutral-100 text-neutral-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right px-4 py-3 text-sm space-x-2">
                      <Link href={`/dashboard/content/editor?id=${c.id}`} className="text-neutral-600 hover:text-neutral-800">
                        Edit
                      </Link>
                      <button onClick={() => deleteContent(c.id)} className="text-neutral-600 hover:text-neutral-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No content yet</p>
            <Link href="/dashboard/content/editor" className="text-neutral-600 hover:text-neutral-800">
              Create your first content →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
