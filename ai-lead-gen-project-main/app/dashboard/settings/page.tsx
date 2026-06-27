'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserSettings {
  name: string;
  email: string;
  timezone: string;
  emailNotifications?: boolean;
  weeklyReports?: boolean;
  twoFactorEnabled: boolean;
}

type TwoFAStep = 'idle' | 'setup' | 'verify' | 'disabling';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    timezone: 'UTC',
    emailNotifications: true,
    weeklyReports: true,
    twoFactorEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2FA state
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('idle');
  const [qrUri, setQrUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data.data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      setSaving(true); setError('');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      router.push('/login');
    } catch (err: any) { setError(err.message); }
  }

  // 2FA: Begin setup
  async function start2FASetup() {
    setTwoFALoading(true); setTwoFAError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) { setTwoFAError(data.message || 'Setup failed'); return; }
      setQrUri(data.data.uri);
      setTotpSecret(data.data.secret);
      setTwoFAStep('setup');
    } finally { setTwoFALoading(false); }
  }

  // 2FA: Verify token to activate
  async function verify2FA() {
    if (!/^\d{6}$/.test(totpToken)) { setTwoFAError('Enter a 6-digit code'); return; }
    setTwoFALoading(true); setTwoFAError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token: totpToken, mode: 'setup' }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFAError(data.message || 'Verification failed'); return; }
      setSettings((s) => ({ ...s, twoFactorEnabled: true }));
      setTwoFAStep('idle'); setTotpToken(''); setQrUri(''); setTotpSecret('');
      setSuccess('2FA enabled successfully!'); setTimeout(() => setSuccess(''), 4000);
    } finally { setTwoFALoading(false); }
  }

  // 2FA: Disable
  async function disable2FA() {
    if (!/^\d{6}$/.test(totpToken)) { setTwoFAError('Enter a 6-digit code to confirm'); return; }
    setTwoFALoading(true); setTwoFAError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token: totpToken }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFAError(data.message || 'Failed to disable'); return; }
      setSettings((s) => ({ ...s, twoFactorEnabled: false }));
      setTwoFAStep('idle'); setTotpToken('');
      setSuccess('2FA disabled'); setTimeout(() => setSuccess(''), 3000);
    } finally { setTwoFALoading(false); }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 text-sm">{success}</div>
        )}

        {/* Account Info */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-black mb-5">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={settings.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-semibold text-black">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              settings.twoFactorEnabled ? 'bg-neutral-100 text-neutral-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {twoFAError && (
            <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">{twoFAError}</div>
          )}

          {twoFAStep === 'idle' && !settings.twoFactorEnabled && (
            <button
              onClick={start2FASetup}
              disabled={twoFALoading}
              className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}

          {twoFAStep === 'setup' && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-black mb-2">Step 1: Scan the QR code</p>
                <p className="text-xs text-gray-500 mb-3">
                  Open your authenticator app and scan this QR code, or enter the secret manually.
                </p>
                {/* QR Code — we use Google Charts API to render the QR from the OTPAuth URI */}
                <div className="flex gap-4 items-start">
                  <img
                    src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(qrUri)}`}
                    alt="QR Code"
                    className="w-40 h-40 border border-gray-200 rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Manual entry key:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all select-all">
                      {totpSecret}
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-black mb-2">Step 2: Enter the 6-digit code</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={verify2FA}
                    disabled={twoFALoading || totpToken.length !== 6}
                    className="px-4 py-2 bg-black text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-900"
                  >
                    {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                  <button
                    onClick={() => { setTwoFAStep('idle'); setTotpToken(''); setTwoFAError(''); }}
                    className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {settings.twoFactorEnabled && twoFAStep === 'idle' && (
            <button
              onClick={() => { setTwoFAStep('disabling'); setTotpToken(''); setTwoFAError(''); }}
              className="mt-4 px-4 py-2 border border-neutral-300 text-neutral-600 text-sm rounded-lg hover:bg-neutral-50"
            >
              Disable 2FA
            </button>
          )}

          {twoFAStep === 'disabling' && (
            <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-neutral-800">Confirm with your authenticator app code:</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
                <button
                  onClick={disable2FA}
                  disabled={twoFALoading || totpToken.length !== 6}
                  className="px-4 py-2 bg-neutral-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-neutral-700"
                >
                  {twoFALoading ? 'Disabling...' : 'Confirm Disable'}
                </button>
                <button
                  onClick={() => { setTwoFAStep('idle'); setTotpToken(''); setTwoFAError(''); }}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
