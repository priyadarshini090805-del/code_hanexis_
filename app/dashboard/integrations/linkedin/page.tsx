'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LinkedInManagementPage() {
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/linkedin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-linkedin-token': localStorage.getItem('linkedinToken') || '',
        },
        body: JSON.stringify({ action: 'profile' }),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.data?.result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncConnections = async () => {
    try {
      setSyncInProgress(true);
      
      const response = await fetch('/api/integrations/linkedin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-linkedin-token': localStorage.getItem('linkedinToken') || '',
        },
        body: JSON.stringify({ action: 'connections' }),
      });

      const data = await response.json();
      if (response.ok) {
        setConnections(data.data?.result || []);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--hx-text-secondary)]">
        Loading LinkedIn profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--hx-text)]">LinkedIn Management</h1>
          <Link href="/dashboard/integrations" className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            ← Back
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-[var(--hx-surface-secondary)] border border-[var(--hx-border)] rounded-lg mb-6">
            <p className="text-[var(--hx-text)]">{error}</p>
          </div>
        )}

        {profile && (
          <div className="bg-[var(--hx-surface-secondary)] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[var(--hx-text)] mb-4">Profile Information</h2>
            <div className="space-y-2">
              <p className="text-[var(--hx-text)]">
                <span className="font-medium">Name:</span> {profile.localizedFirstName} {profile.localizedLastName}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[var(--hx-border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--hx-text)] mb-4">Connections</h2>
          <button
            onClick={handleSyncConnections}
            disabled={syncInProgress}
            className="px-6 py-2 hx-btn-primary rounded-lg hover:bg-[var(--hx-brand-light)] disabled:opacity-50 mb-6"
          >
            {syncInProgress ? 'Syncing...' : 'Sync Connections'}
          </button>

          {connections.length > 0 && (
            <div className="space-y-3">
              {connections.map((conn, idx) => (
                <div key={idx} className="p-3 border border-[var(--hx-border)] rounded">
                  <p className="font-medium text-[var(--hx-text)]">{conn.firstName} {conn.lastName}</p>
                  <p className="text-sm text-[var(--hx-text-secondary)]">{conn.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
