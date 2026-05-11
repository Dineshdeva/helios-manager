import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSettingValues, getSettingValue, getSettingValueHistory, createSettingValue, updateSettingValue } from '../services/api';
import { useWriteMode } from '../context/WriteModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';

/**
 * Setting Values page — search, inspect, audit, create, and update.
 *
 * UI action: search / filter
 *   → GET /bff/setting-values?…   → Helios: getAllSettingValues
 * UI action: Load More
 *   → GET /bff/setting-values?nextPageToken=…   → Helios: getAllSettingValues
 * UI action: click row → side panel detail
 *   → GET /bff/setting-values/:id   → Helios: getSettingValue
 * UI action: History button
 *   → GET /bff/setting-values/:id/history   → Helios: executeHistoryQuery
 * UI action: Create Setting Value (write mode)
 *   → POST /bff/setting-values   → Helios: createSettingValue
 * UI action: Edit Setting Value (write mode)
 *   → PUT /bff/setting-values/:id   → Helios: updateSettingValue
 */
function HistoryEntry({ entry }) {
  return (
    <div className="border-l-2 border-brand-200 pl-3 py-1">
      <p className="text-xs font-medium text-gray-700">
        {entry.operation ?? 'CHANGE'}{' '}
        <span className="text-gray-400">by {entry.modifiedBy ?? '—'}</span>
      </p>
      <p className="text-xs text-gray-500">
        {entry.modifiedOn ? new Date(entry.modifiedOn).toLocaleString() : ''}
      </p>
      {entry.comment && (
        <p className="text-xs text-gray-600 mt-0.5 italic">"{entry.comment}"</p>
      )}
    </div>
  );
}

const EMPTY_CREATE = { applicationId: '', name: '', value: '', comment: '', applyTo: '' };
const EMPTY_EDIT = { value: '', comment: '' };

export default function SettingValues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nameQuery, setNameQuery] = useState(searchParams.get('name') || '');
  const [applicationId, setApplicationId] = useState(searchParams.get('applicationId') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenantId') || '');

  const [items, setItems] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const { writeMode } = useWriteMode();

  // Side panel
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(false);

  // Edit form
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(false);

  const [formError, setFormError] = useState(null);

  const load = useCallback(async (name, appId, tid, token = null) => {
    if (token) setPageLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await getSettingValues({
        name: name || undefined,
        applicationId: appId || undefined,
        tenantId: tid || undefined,
        pageSize: 50,
        nextPageToken: token || undefined,
      });
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

  useEffect(() => { load(nameQuery, applicationId, tenantId); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems([]); setNextPageToken(null);
      load(nameQuery, applicationId, tenantId);
      const params = {};
      if (nameQuery) params.name = nameQuery;
      if (applicationId) params.applicationId = applicationId;
      if (tenantId) params.tenantId = tenantId;
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(timer);
  }, [nameQuery, applicationId, tenantId, load, setSearchParams]);

  const openDetail = useCallback(async (sv) => {
    setSelected(null);
    setHistory(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail = await getSettingValue(sv.id, tenantId || undefined);
      setSelected(detail);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }, [tenantId]);

  const loadHistory = useCallback(async () => {
    if (!selected) return;
    setHistoryLoading(true);
    try {
      const h = await getSettingValueHistory(selected.id, tenantId || undefined);
      setHistory(h.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [selected, tenantId]);

  const handleCreate = async () => {
    setCreateSubmitting(true);
    setFormError(null);
    try {
      let applyTo;
      try { applyTo = JSON.parse(createForm.applyTo); } catch { applyTo = createForm.applyTo; }
      const created = await createSettingValue(
        { applicationId: createForm.applicationId, name: createForm.name, value: createForm.value, comment: createForm.comment || undefined, applyTo },
        tenantId || undefined
      );
      setItems((prev) => [created, ...prev]);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
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
      const updated = await updateSettingValue(editItem.id, { value: editForm.value, comment: editForm.comment || undefined }, tenantId || undefined);
      setItems((prev) => prev.map((sv) => (sv.id === updated.id ? updated : sv)));
      if (selected?.id === updated.id) setSelected(updated);
      setEditItem(null);
      setPendingEdit(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const cField = (key) => ({ value: createForm[key], onChange: (e) => setCreateForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setting Values</h1>
          <p className="text-gray-500 mt-1">{items.length > 0 ? `${items.length}${totalCount != null ? ` of ${totalCount}` : ''} result(s)` : ''}</p>
        </div>
        {writeMode && (
          <button onClick={() => { setShowCreate(true); setCreateForm(EMPTY_CREATE); setFormError(null); }} className="btn-primary">
            + Create Setting Value
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search by setting name…" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
        </div>
        <input type="text" className="input max-w-xs" placeholder="Application ID…" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
        <input type="text" className="input max-w-xs" placeholder="Tenant ID…" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      </div>

      <div className="flex gap-6">
        {/* ── Results ── */}
        <div className="flex-1 min-w-0">
          {error && <ErrorAlert message={error} onRetry={() => load(nameQuery, applicationId, tenantId)} />}
          {loading && !error && <LoadingSpinner />}

          {!loading && !error && (
            <>
              <div className="card overflow-hidden">
                {items.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">No setting values found.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Name', 'Application ID', 'Value', 'Type', 'Modified On', writeMode && 'Actions'].filter(Boolean).map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((sv) => (
                        <tr
                          key={sv.id}
                          className={`table-row-hover ${selected?.id === sv.id ? 'bg-brand-50' : ''}`}
                          onClick={() => openDetail(sv)}
                        >
                          <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 max-w-xs truncate">{sv.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono truncate max-w-[120px]">{sv.applicationId}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate font-mono">
                            {sv.isSecret ? <span className="text-gray-400 italic">redacted</span> : sv.value}
                          </td>
                          <td className="px-6 py-4">{sv.isSecret ? <Badge variant="red">Secret</Badge> : <Badge variant="gray">Plain</Badge>}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{sv.modifiedOn ? new Date(sv.modifiedOn).toLocaleDateString() : '—'}</td>
                          {writeMode && (
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="btn-secondary text-xs py-1"
                                onClick={() => { setEditItem(sv); setEditForm({ value: sv.isSecret ? '' : (sv.value ?? ''), comment: sv.comment ?? '' }); setFormError(null); }}
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

              <Pagination nextPageToken={nextPageToken} onLoadMore={() => load(nameQuery, applicationId, tenantId, nextPageToken)} loading={pageLoading} totalCount={totalCount} loadedCount={items.length} />
            </>
          )}
        </div>

        {/* ── Side panel ── */}
        {(detailLoading || detailError || selected) && (
          <div className="w-80 flex-shrink-0">
            <div className="card p-5 sticky top-8">
              {detailLoading && <LoadingSpinner message="Loading detail…" />}
              {detailError && <ErrorAlert message={detailError} />}
              {!detailLoading && !detailError && selected && (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Setting Name</p>
                      <p className="font-mono text-sm font-semibold text-gray-900 break-all">{selected.name}</p>
                    </div>
                    <button onClick={() => { setSelected(null); setHistory(null); }} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">✕</button>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-xs text-gray-500">Application ID</dt><dd className="font-mono text-gray-800 break-all">{selected.applicationId}</dd></div>
                    <div>
                      <dt className="text-xs text-gray-500">Value</dt>
                      <dd className="font-mono text-gray-800 break-all bg-gray-50 rounded px-2 py-1 mt-0.5">
                        {selected.isSecret ? <span className="text-gray-400 italic">*** secret — not transmitted ***</span> : selected.value}
                      </dd>
                    </div>
                    {selected.comment && <div><dt className="text-xs text-gray-500">Comment</dt><dd className="text-gray-700 italic">{selected.comment}</dd></div>}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {selected.isSecret && <Badge variant="red">Secret</Badge>}
                      {selected.isTenantSpecific && <Badge variant="blue">Tenant-specific</Badge>}
                    </div>
                    <div><dt className="text-xs text-gray-500">Modified By</dt><dd className="text-gray-800">{selected.modifiedBy ?? '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Modified On</dt><dd className="text-gray-800">{selected.modifiedOn ? new Date(selected.modifiedOn).toLocaleString() : '—'}</dd></div>
                  </dl>
                  {writeMode && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        className="btn-secondary w-full text-sm"
                        onClick={() => { setEditItem(selected); setEditForm({ value: selected.isSecret ? '' : (selected.value ?? ''), comment: selected.comment ?? '' }); setFormError(null); }}
                      >
                        ✏️ Edit this value
                      </button>
                    </div>
                  )}
                  {/* History */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">History</p>
                      {!history && (
                        <button onClick={loadHistory} disabled={historyLoading} className="btn-secondary text-xs py-1">
                          {historyLoading ? 'Loading…' : 'Load'}
                        </button>
                      )}
                    </div>
                    {history && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {history.length === 0 ? <p className="text-xs text-gray-400 italic">No history available.</p> : history.map((entry, i) => <HistoryEntry key={i} entry={entry} />)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <FormModal open={showCreate} title="Create Setting Value" onClose={() => setShowCreate(false)} onSubmit={() => setPendingCreate(true)} submitting={createSubmitting} submitLabel="Create">
        {formError && <ErrorAlert message={formError} />}
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Application ID <span className="text-red-500">*</span></label><input className="input font-mono" required {...cField('applicationId')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Setting Name <span className="text-red-500">*</span></label><input className="input font-mono" required {...cField('name')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Value <span className="text-red-500">*</span></label><textarea className="input resize-none" rows={2} required {...cField('value')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Comment</label><input className="input" {...cField('comment')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Apply To (JSON) <span className="text-red-500">*</span></label><textarea className="input font-mono resize-none text-xs" rows={3} placeholder='{"deploymentId": "..."}' required {...cField('applyTo')} /></div>
        </div>
      </FormModal>

      {/* Edit modal */}
      <FormModal open={!!editItem} title={`Edit: ${editItem?.name}`} onClose={() => setEditItem(null)} onSubmit={() => setPendingEdit(true)} submitting={editSubmitting} submitLabel="Save">
        {formError && <ErrorAlert message={formError} />}
        {editItem?.isSecret && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">This is a secret setting. Enter the new value to overwrite it.</p>}
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Value <span className="text-red-500">*</span></label><textarea className="input font-mono resize-none" rows={3} required value={editForm.value} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Comment</label><input className="input" value={editForm.comment} onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))} /></div>
        </div>
      </FormModal>

      {/* Confirm dialogs */}
      <ConfirmDialog open={pendingCreate} title="Create Setting Value" message={`Create setting "${createForm.name}" for application "${createForm.applicationId}"?`} confirmLabel="Create" onConfirm={handleCreate} onCancel={() => setPendingCreate(false)} />
      <ConfirmDialog open={pendingEdit} title="Save Setting Value" message={`Update the value of "${editItem?.name}"? This change will take effect immediately.`} confirmLabel="Save" danger onConfirm={handleEdit} onCancel={() => setPendingEdit(false)} />
    </div>
  );
}

