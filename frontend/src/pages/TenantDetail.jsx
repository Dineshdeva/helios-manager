import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTenant, updateTenant } from '../services/api';
import { useWriteMode } from '../context/WriteModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';

/**
 * Tenant detail page — property inspection and editing for a single tenant.
 *
 * UI action: page load
 *   → GET /bff/tenants/:id   → Helios: getTenant
 *
 * UI action: Edit Tenant (write mode)
 *   → PUT /bff/tenants/:id   → Helios: updateTenant
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
  const { writeMode } = useWriteMode();

  // Edit form
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
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
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async () => {
    setEditSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateTenant(id, { name: editName.trim() });
      setTenant(updated);
      setShowEdit(false);
      setPendingEdit(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

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
            <div className="ml-auto flex items-center gap-2">
              {tenant.isTestData ? (
                <Badge variant="yellow">Test Data</Badge>
              ) : (
                <Badge variant="green">Live</Badge>
              )}
              {writeMode && (
                <button
                  className="btn-secondary text-sm"
                  onClick={() => { setEditName(tenant.name); setFormError(null); setShowEdit(true); }}
                >
                  ✏️ Edit
                </button>
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

      {/* Edit modal */}
      <FormModal
        open={showEdit}
        title={`Edit Tenant: ${tenant?.name}`}
        onClose={() => setShowEdit(false)}
        onSubmit={() => setPendingEdit(true)}
        submitting={editSubmitting}
        submitLabel="Save"
      >
        {formError && <ErrorAlert message={formError} />}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Name <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />
        </div>
      </FormModal>

      <ConfirmDialog
        open={pendingEdit}
        title="Save Changes"
        message={`Rename tenant to "${editName}"? This affects all systems using this tenant.`}
        confirmLabel="Save"
        onConfirm={handleEdit}
        onCancel={() => setPendingEdit(false)}
      />
    </div>
  );
}
