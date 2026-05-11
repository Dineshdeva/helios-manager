import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenants } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';

/**
 * Tenants list page — search and browse tenants.
 *
 * UI action: type in search box
 *   → GET /bff/tenants?name=…   → Helios: getAllTenants
 *
 * UI action: click row
 *   → navigates to /tenants/:id  (detail page)
 */
export default function Tenants() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (name = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTenants({ name: name || undefined, pageSize: 50 });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => load(query), 350);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.items?.length ?? 0} result(s)` : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by tenant name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {error && <ErrorAlert message={error} onRetry={() => load(query)} />}
      {loading && !error && <LoadingSpinner />}

      {!loading && !error && data && (
        <div className="card overflow-hidden">
          {data.items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No tenants found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'ID', 'Created By', 'Created On', 'Test Data'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="table-row-hover"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {tenant.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tenant.createdBy ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tenant.createdOn
                        ? new Date(tenant.createdOn).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {tenant.isTestData ? (
                        <Badge variant="yellow">Test</Badge>
                      ) : (
                        <Badge variant="green">Live</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
