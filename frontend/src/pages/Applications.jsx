import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApplications, createApplication } from '../services/api';
import { useWriteMode } from '../context/WriteModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';

/**
 * Applications list page — search, browse, and create applications.
 *
 * UI action: search or filter by tenant
 *   → GET /bff/applications?name=…&tenantId=…   → Helios: getAllApplications
 * UI action: Load More
 *   → GET /bff/applications?nextPageToken=…      → Helios: getAllApplications
 * UI action: Create Application (write mode)
 *   → POST /bff/applications                    → Helios: createApplication
 */
const EMPTY_FORM = { name: '', displayName: '', owner: '', ownerEmail: '', tenancyType: '' };

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('name') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenantId') || '');
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async (name, tid, token = null) => {
    if (token) setPageLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await getApplications({ name: name || undefined, tenantId: tid || undefined, pageSize: 50, nextPageToken: token || undefined });
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

  useEffect(() => { load(query, tenantId); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems([]); setNextPageToken(null);
      load(query, tenantId);
      const params = {};
      if (query) params.name = query;
      if (tenantId) params.tenantId = tenantId;
      setSearchParams(params);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, tenantId, load, setSearchParams]);

  const handleCreate = async () => {
    setCreateSubmitting(true);
    setFormError(null);
    try {
      const created = await createApplication(
        { name: form.name, displayName: form.displayName || undefined, owner: form.owner, ownerEmail: form.ownerEmail, tenancyType: form.tenancyType || undefined },
        tenantId || undefined
      );
      setItems((prev) => [created, ...prev]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setPendingCreate(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">{items.length > 0 ? `${items.length}${totalCount != null ? ` of ${totalCount}` : ''} result(s)` : ''}</p>
        </div>
        {writeMode && (
          <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setFormError(null); }} className="btn-primary">
            + Create Application
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search by app name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <input type="text" className="input max-w-xs" placeholder="Filter by tenant ID…" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      </div>

      {error && <ErrorAlert message={error} onRetry={() => load(query, tenantId)} />}
      {loading && !error && <LoadingSpinner />}

      {!loading && !error && (
        <>
          <div className="card overflow-hidden">
            {items.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No applications found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Display Name', 'ID', 'Owner', 'Type', 'Created On'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((app) => (
                    <tr key={app.id} className="table-row-hover" onClick={() => navigate(`/applications/${app.id}`)}>
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
                          {!app.isPublic && !app.isShared && !app.isCustomerDeveloped && <Badge variant="gray">Standard</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.createdOn ? new Date(app.createdOn).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination nextPageToken={nextPageToken} onLoadMore={() => load(query, tenantId, nextPageToken)} loading={pageLoading} totalCount={totalCount} loadedCount={items.length} />
        </>
      )}

      {/* Create Application modal */}
      <FormModal open={showCreate} title="Create Application" onClose={() => setShowCreate(false)} onSubmit={() => setPendingCreate(true)} submitting={createSubmitting} submitLabel="Create">
        {formError && <ErrorAlert message={formError} />}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="my-app" required {...field('name')} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input className="input" placeholder="My Application" {...field('displayName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner <span className="text-red-500">*</span></label>
            <input className="input" placeholder="team-name" required {...field('owner')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email <span className="text-red-500">*</span></label>
            <input className="input" type="email" placeholder="team@example.com" required {...field('ownerEmail')} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenancy Type</label>
            <select className="input" {...field('tenancyType')}>
              <option value="">— Select —</option>
              <option value="multitenant">Multitenant</option>
              <option value="singletenant">Single-tenant</option>
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={pendingCreate}
        title="Create Application"
        message={`Create application "${form.name}" owned by ${form.owner}?`}
        confirmLabel="Create"
        onConfirm={handleCreate}
        onCancel={() => setPendingCreate(false)}
      />
    </div>
  );
}
