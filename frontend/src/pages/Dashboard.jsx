import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getTenants, getApplications, getSettingValues } from '../services/api';

/**
 * Dashboard page — quick overview of key entity counts.
 *
 * UI action: Load dashboard
 *   → GET /bff/tenants          → Helios: getAllTenants
 *   → GET /bff/applications     → Helios: getAllApplications
 *   → GET /bff/setting-values   → Helios: getAllSettingValues
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenants, apps, settings] = await Promise.all([
        getTenants({ pageSize: 1 }),
        getApplications({ pageSize: 1 }),
        getSettingValues({ pageSize: 1 }),
      ]);
      setStats({
        tenants: tenants.totalCount,
        apps: apps.totalCount,
        settings: settings.totalCount,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your Helios Settings Vault.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onRetry={load} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Tenants" value={stats?.tenants} icon="🏢" color="brand" />
        <StatCard title="Applications" value={stats?.apps} icon="📦" color="green" />
        <StatCard title="Setting Values" value={stats?.settings} icon="⚙️" color="blue" />
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/tenants', label: 'Browse Tenants', icon: '🏢', desc: 'Search and inspect tenant records' },
          { to: '/applications', label: 'Browse Applications', icon: '📦', desc: 'Explore applications and their deployments' },
          { to: '/setting-values', label: 'Browse Settings', icon: '⚙️', desc: 'Search and audit configuration values' },
        ].map(({ to, label, icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="card p-5 flex items-start gap-3 hover:shadow-md transition-shadow group"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                {label}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
