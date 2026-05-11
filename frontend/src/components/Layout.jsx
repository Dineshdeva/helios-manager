import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getWhoami } from '../services/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/tenants', label: 'Tenants', icon: '🏢' },
  { to: '/applications', label: 'Applications', icon: '📦' },
  { to: '/setting-values', label: 'Setting Values', icon: '⚙️' },
];

export default function Layout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // UI: top-bar user chip → GET /bff/whoami → Helios: getCurrentUserInfo
    getWhoami().then(setUser).catch(() => {});
  }, []);

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

        {/* User chip */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
              {user?.userId?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.userId ?? 'Loading…'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.tenantId ?? ''}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
