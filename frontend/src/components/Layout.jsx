import { NavLink, Outlet } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWriteMode } from '../context/WriteModeContext';
import { postDevToken } from '../services/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/tenants', label: 'Tenants', icon: '🏢' },
  { to: '/applications', label: 'Applications', icon: '📦' },
  { to: '/setting-values', label: 'Setting Values', icon: '⚙️' },
];

export default function Layout() {
  const { authenticated, user, loginUrl, logout, loading, refresh } = useAuth();
  const { writeMode, setWriteMode, serverWriteEnabled } = useWriteMode();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [tokenStatus, setTokenStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [tokenError, setTokenError] = useState('');
  const tokenRef = useRef(null);

  async function handlePasteToken() {
    const trimmed = tokenValue.trim();
    if (!trimmed) return;
    setTokenStatus('loading');
    setTokenError('');
    try {
      await postDevToken(trimmed);
      setTokenStatus('ok');
      setTokenValue('');
      setShowTokenInput(false);
      await refresh();
    } catch (err) {
      setTokenStatus('error');
      setTokenError(err?.response?.data?.error?.message || err.message || 'Failed to set token. Ensure the token is valid and copied correctly from the Helios Swagger UI.');
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌞</span>
            <div>
              <p className="font-bold text-gray-900 leading-tight">Helios Manager</p>
              <p className="text-xs text-gray-500">Settings Vault</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Write Mode toggle ── */}
        {serverWriteEnabled && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
              <div>
                <p className="text-xs font-medium text-gray-700">Write Mode</p>
                <p className="text-xs text-gray-400">
                  {writeMode ? 'Mutations enabled' : 'Read-only'}
                </p>
              </div>
              <button
                onClick={() => setWriteMode((v) => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
                  writeMode ? 'bg-brand-600' : 'bg-gray-300'
                }`}
                aria-pressed={writeMode}
                title={writeMode ? 'Disable write mode' : 'Enable write mode'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                    writeMode ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {writeMode && (
              <p className="text-xs text-amber-600 mt-1.5 px-1">
                ⚠️ Changes require confirmation
              </p>
            )}
          </div>
        )}

        {/* ── Auth section ── */}
        <div className="px-4 py-4 border-t border-gray-200">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400 animate-pulse">Checking session…</div>
          ) : authenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50">
                <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {user?.name || user?.email || 'Authenticated'}
                  </p>
                  <p className="text-xs text-green-700">● Session active</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-medium text-amber-800">Not authenticated</p>
                <p className="text-xs text-amber-600 mt-0.5">Authorize to access Helios</p>
              </div>
              {/* Clicking this triggers the Authorization Code + PKCE flow via BFF */}
              <a
                href={loginUrl}
                className="flex items-center justify-center gap-2 w-full btn-primary text-sm py-2"
              >
                <span>🔐</span> Authorize
              </a>

              {/* ── Fallback: paste token from Helios Swagger UI ── */}
              <button
                onClick={() => {
                  setShowTokenInput((v) => !v);
                  setTokenStatus(null);
                  setTokenError('');
                  setTimeout(() => tokenRef.current?.focus(), 50);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showTokenInput ? '▲ Hide token input' : '🔑 Paste token from Swagger UI'}
              </button>

              {showTokenInput && (
                <div className="space-y-1.5 px-1">
                  <p className="text-xs text-gray-500 leading-snug">
                    Can't register the redirect URI? Authorize in the{' '}
                    <strong>Helios Swagger UI</strong>, copy the Bearer token from DevTools →
                    Network, and paste it here.
                  </p>
                  <textarea
                    ref={tokenRef}
                    rows={3}
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    placeholder="Paste Bearer token…"
                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {tokenStatus === 'error' && (
                    <p className="text-xs text-red-600">{tokenError}</p>
                  )}
                  <button
                    onClick={handlePasteToken}
                    disabled={!tokenValue.trim() || tokenStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {tokenStatus === 'loading' ? 'Setting…' : '✓ Use this token'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
