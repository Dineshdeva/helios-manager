import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTenant } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';

/**
 * Tenant detail page — property inspection for a single tenant.
 *
 * UI action: page load
 *   → GET /bff/tenants/:id   → Helios: getTenant
 */
function InfoRow({ label, value }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
        {value ?? <span className="text-gray-400 italic">—</span>}
      </dd>
    </div>
  );
}

export default function TenantDetail() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTenant(id);
      setTenant(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tenants" className="hover:text-brand-600 transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant?.name ?? id}</span>
      </nav>

      {loading && <LoadingSpinner message="Loading tenant…" />}
      {error && <ErrorAlert message={error} onRetry={load} />}

      {!loading && !error && tenant && (
        <>
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">🏢</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{tenant.id}</p>
            </div>
            <div className="ml-auto">
              {tenant.isTestData ? (
                <Badge variant="yellow">Test Data</Badge>
              ) : (
                <Badge variant="green">Live</Badge>
              )}
            </div>
          </div>

          {/* Details card */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Details</h2>
            <dl className="divide-y divide-gray-200">
              <InfoRow label="ID" value={<span className="font-mono">{tenant.id}</span>} />
              <InfoRow label="Name" value={tenant.name} />
              <InfoRow label="Test Data" value={tenant.isTestData ? 'Yes' : 'No'} />
              <InfoRow label="Created By" value={tenant.createdBy} />
              <InfoRow
                label="Created On"
                value={tenant.createdOn ? new Date(tenant.createdOn).toLocaleString() : null}
              />
              <InfoRow label="Modified By" value={tenant.modifiedBy} />
              <InfoRow
                label="Modified On"
                value={tenant.modifiedOn ? new Date(tenant.modifiedOn).toLocaleString() : null}
              />
            </dl>
          </div>

          {/* Quick link */}
          <div className="mt-4">
            <Link
              to={`/applications?tenantId=${tenant.id}`}
              className="btn-secondary"
            >
              View Applications for this Tenant →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
