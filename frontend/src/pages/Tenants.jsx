import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenants, createTenant, updateTenant } from '../services/api';
import { useWriteMode } from '../context/WriteModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';

/**
 * Tenants list page — search, browse, create, and edit tenants.
 *
 * UI action: search box
 *   → GET /bff/tenants?name=…   → Helios: getAllTenants
 * UI action: Load More
 *   → GET /bff/tenants?nextPageToken=…   → Helios: getAllTenants
 * UI action: Create Tenant (write mode)
 *   → POST /bff/tenants   → Helios: createTenant
 * UI action: Edit Tenant (write mode)
 *   → PUT /bff/tenants/:id   → Helios: updateTenant
 */
export default function Tenants() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { writeMode } = useWriteMode();

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(false);

  // Edit form
  const [editTenant, setEditTenant] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(false);

  const [formError, setFormError] = useState(null);

  const load = useCallback(async (name = '', token = null) => {
    if (token) setPageLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await getTenants({ name: name || undefined, pageSize: 50, nextPageToken: token || undefined });
      setItems((prev) => token ? [...prev, ...result.items] : result.items);
      setNextPageToken(result.nextPageToken);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setItems([]); setNextPageToken(null); load(query); }, 350);
    return () => clearTimeout(timer);
  }, [query, load]);

  const handleCreate = async () => {
    setCreateSubmitting(true);
    setFormError(null);
    try {
      const created = await createTenant({ name: createName.trim() });
      setItems((prev) => [created, ...prev]);
      setShowCreate(false);
      setCreateName('');
      setPendingCreate(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async () => {
    setEditSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateTenant(editTenant.id, { name: editName.trim() });
      setItems((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTenant(null);
      setPendingEdit(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">{items.length > 0 ? `${items.length}${totalCount != null ? ` of ${totalCount}` : ''} result(s)` : ''}</p>
        </div>
        {writeMode && (
          <button onClick={() => { setShowCreate(true); setCreateName(''); setFormError(null); }} className="btn-primary">
            + Create Tenant
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search by tenant name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => load(query)} />}
      {loading && !error && <LoadingSpinner />}

      {!loading && !error && (
        <>
          <div className="card overflow-hidden">
            {items.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No tenants found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'ID', 'Created By', 'Created On', 'Test Data', writeMode && 'Actions'].filter(Boolean).map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((tenant) => (
                    <tr key={tenant.id} className="table-row-hover" onClick={() => navigate(`/tenants/${tenant.id}`)}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tenant.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{tenant.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tenant.createdBy ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tenant.createdOn ? new Date(tenant.createdOn).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">{tenant.isTestData ? <Badge variant="yellow">Test</Badge> : <Badge variant="green">Live</Badge>}</td>
                      {writeMode && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-secondary text-xs py-1"
                            onClick={() => { setEditTenant(tenant); setEditName(tenant.name); setFormError(null); }}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination nextPageToken={nextPageToken} onLoadMore={() => load(query, nextPageToken)} loading={pageLoading} totalCount={totalCount} loadedCount={items.length} />
        </>
      )}

      {/* Create modal */}
      <FormModal open={showCreate} title="Create Tenant" onClose={() => setShowCreate(false)} onSubmit={() => setPendingCreate(true)} submitting={createSubmitting} submitLabel="Create">
        {formError && <ErrorAlert message={formError} />}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name <span className="text-red-500">*</span></label>
          <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. my-tenant" required autoFocus />
        </div>
      </FormModal>

      {/* Edit modal */}
      <FormModal open={!!editTenant} title={`Edit Tenant: ${editTenant?.name}`} onClose={() => setEditTenant(null)} onSubmit={() => setPendingEdit(true)} submitting={editSubmitting} submitLabel="Save">
        {formError && <ErrorAlert message={formError} />}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name <span className="text-red-500">*</span></label>
          <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. my-tenant" required autoFocus />
        </div>
      </FormModal>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={pendingCreate}
        title="Create Tenant"
        message={`Create a new tenant named "${createName}"?`}
        confirmLabel="Create"
        onConfirm={handleCreate}
        onCancel={() => setPendingCreate(false)}
      />
      <ConfirmDialog
        open={pendingEdit}
        title="Save Changes"
        message={`Rename tenant to "${editName}"? This will affect all systems using this tenant.`}
        confirmLabel="Save"
        onConfirm={handleEdit}
        onCancel={() => setPendingEdit(false)}
      />
    </div>
  );
}
