import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApplications } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';

/**
 * Applications list page — search and browse applications.
 *
 * UI action: search or filter by tenant
 *   → GET /bff/applications?name=…&tenantId=…   → Helios: getAllApplications
 *
 * UI action: click row
 *   → navigates to /applications/:id
 */
export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('name') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenantId') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (name, tid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getApplications({
        name: name || undefined,
        tenantId: tid || undefined,
        pageSize: 50,
      });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(query, tenantId); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(query, tenantId);
      setSearchParams(
        Object.fromEntries(
          [query && ['name', query], tenantId && ['tenantId', tenantId]].filter(Boolean)
        )
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [query, tenantId]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.items?.length ?? 0} result(s)` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by app name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Filter by tenant ID…"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onRetry={() => load(query, tenantId)} />}
      {loading && !error && <LoadingSpinner />}

      {!loading && !error && data && (
        <div className="card overflow-hidden">
          {data.items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No applications found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Display Name', 'ID', 'Owner', 'Type', 'Created On'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((app) => (
                  <tr
                    key={app.id}
                    className="table-row-hover"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{app.displayName}</p>
                      <p className="text-xs text-gray-500 font-mono">{app.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{app.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{app.owner ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {app.isPublic && <Badge variant="blue">Public</Badge>}
                        {app.isShared && <Badge variant="purple">Shared</Badge>}
                        {app.isCustomerDeveloped && <Badge variant="yellow">Customer</Badge>}
                        {!app.isPublic && !app.isShared && !app.isCustomerDeveloped && (
                          <Badge variant="gray">Standard</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {app.createdOn ? new Date(app.createdOn).toLocaleDateString() : '—'}
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
