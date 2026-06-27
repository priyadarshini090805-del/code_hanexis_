'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  followers: number;
}

interface InstagramMetric {
  date: string;
  impressions: number;
  reach: number;
  profileViews: number;
  engagement: number;
}

export default function InstagramPage() {
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [metrics, setMetrics] = useState<InstagramMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchMetrics();
  }, [period]);

  const fetchProfile = async () => {
    try {
      const token = 'cookie';
      const response = await fetch('/api/integrations/instagram/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'profile' }),
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data.data?.profile);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch(
        `/api/integrations/instagram/analytics?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.data?.metrics || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Instagram Integration</h1>
          <Link href="/dashboard/integrations" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        {profile && (
          <div className="mb-8 bg-gradient-to-r from-neutral-50 to-neutral-50 p-8 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">{profile.name}</h2>
                <p className="text-gray-600">@{profile.username}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-black">{profile.followers.toLocaleString()}</p>
                <p className="text-gray-600">Followers</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Performance Metrics</h3>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading metrics...</p>
          ) : metrics.length > 0 ? (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Impressions</p>
                <p className="text-2xl font-bold text-black">
                  {Math.round(metrics.reduce((sum, m) => sum + m.impressions, 0) / metrics.length).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Reach</p>
                <p className="text-2xl font-bold text-black">
                  {Math.round(metrics.reduce((sum, m) => sum + m.reach, 0) / metrics.length).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-black">
                  {(metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.length).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Profile Views</p>
                <p className="text-2xl font-bold text-black">
                  {Math.round(metrics.reduce((sum, m) => sum + m.profileViews, 0) / metrics.length).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No metrics available</p>
          )}

          {metrics.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Date</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Impressions</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Reach</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Engagement</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Profile Views</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">{new Date(m.date).toLocaleDateString()}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.impressions.toLocaleString()}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.reach.toLocaleString()}</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.engagement.toFixed(1)}%</td>
                      <td className="text-right px-4 py-3 text-sm text-black">{m.profileViews.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
