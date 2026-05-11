import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWriteMode } from '../context/WriteModeContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/tenants', label: 'Tenants', icon: '🏢' },
  { to: '/applications', label: 'Applications', icon: '📦' },
  { to: '/setting-values', label: 'Setting Values', icon: '⚙️' },
];

export default function Layout() {
  const { authenticated, user, loginUrl, logout, loading } = useAuth();
  const { writeMode, setWriteMode, serverWriteEnabled } = useWriteMode();

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
