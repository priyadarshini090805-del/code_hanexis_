'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Integration {
  id: string;
  provider: 'LINKEDIN' | 'INSTAGRAM' | 'GOOGLE';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  profileName?: string;
  profileUrl?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

const providers = [
  {
    name: 'LinkedIn',
    id: 'LINKEDIN',
    icon: '💼',
    description: 'Connect your LinkedIn account to sync leads and publish posts',
    color: 'bg-neutral-50',
  },
  {
    name: 'Instagram',
    id: 'INSTAGRAM',
    icon: '📷',
    description: 'Connect Instagram to publish and schedule content',
    color: 'bg-neutral-50',
  },
  {
    name: 'Google',
    id: 'GOOGLE',
    icon: '🔍',
    description: 'Connect Google to capture Gmail inquiries as leads automatically',
    color: 'bg-neutral-50',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [banner, setBanner] = useState('');

  useEffect(() => {
    fetchIntegrations();
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) setBanner(`${params.get('connected')} connected successfully!`);
    if (params.get('error')) setError(decodeURIComponent(params.get('error') || ''));
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const token = 'cookie';
      const response = await fetch('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data.data?.integrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (providerId: string) => {
    return integrations.find(i => i.provider === providerId);
  };

  const disconnectIntegration = async (id: string) => {
    if (!confirm('Disconnect this integration?')) return;
    try {
      const token = 'cookie';
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      setIntegrations(integrations.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConnect = (providerId: string) => {
    const token = 'cookie' || '';
    const path = providerId.toLowerCase();
    console.log("dsafsaklfdjaslkfdjasklfjalskd",`/api/integrations/${path}/authorize?token=${encodeURIComponent(token)}`)
    window.location.href = `/api/integrations/${path}/authorize?token=${encodeURIComponent(token)}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Integrations</h1>
          <p className="text-gray-600 mt-2">Connect your social media and other platforms</p>
        </div>

        {banner && (
          <div className="mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800">
            {banner}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading integrations...</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(provider => {
              const integration = getIntegration(provider.id);
              return (
                <div
                  key={provider.id}
                  className={`${provider.color} border-2 border-gray-200 rounded-lg p-6`}
                >
                  <div className="text-4xl mb-3">{provider.icon}</div>
                  <h3 className="text-xl font-bold text-black mb-2">{provider.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

                  {integration ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600">Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              integration.status === 'ACTIVE' ? 'bg-neutral-500' : 'bg-neutral-500'
                            }`}
                          />
                          <span className="font-medium text-black">{integration.status}</span>
                        </div>
                      </div>

                      {integration.profileName && (
                        <div className="p-3 bg-white rounded-lg">
                          <div className="text-xs text-gray-600">Profile</div>
                          <div className="font-medium text-black">{integration.profileName}</div>
                        </div>
                      )}

                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600">Connected</div>
                        <div className="font-medium text-black">{formatDate(integration.connectedAt)}</div>
                      </div>

                      <button
                        onClick={() => disconnectIntegration(integration.id)}
                        className="w-full px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                    >
                      Connect {provider.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
