import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getApplication,
  getDeployments,
  getSettingDefinitions,
  updateApplication,
} from '../services/api';
import { useWriteMode } from '../context/WriteModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';

/**
 * Application detail page — inspect an application, its deployments and setting definitions.
 *
 * UI action: page load
 *   → GET /bff/applications/:id              → Helios: getApplication
 *   → GET /bff/applications/:id/deployments  → Helios: getAllDeployments
 *   → GET /bff/applications/:id/setting-definitions → Helios: getAllApplicationSettingDefinitions
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('details');
  const [app, setApp] = useState(null);
  const [deployments, setDeployments] = useState(null);
  const [settingDefs, setSettingDefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { writeMode } = useWriteMode();

  // Edit form
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', owner: '', ownerEmail: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [appData, depData, sdData] = await Promise.all([
          getApplication(id),
          getDeployments(id),
          getSettingDefinitions(id),
        ]);
        setApp(appData);
        setDeployments(depData);
        setSettingDefs(sdData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/applications" className="hover:text-brand-600 transition-colors">
          Applications
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{app?.displayName ?? id}</span>
      </nav>

      {loading && <LoadingSpinner message="Loading application…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && app && (
        <>
          {/* Title row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">📦</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{app.displayName}</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{app.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {app.isPublic && <Badge variant="blue">Public</Badge>}
              {app.isShared && <Badge variant="purple">Shared</Badge>}
              {app.isCustomerDeveloped && <Badge variant="yellow">Customer</Badge>}
              {app.tenancyType && <Badge variant="indigo">{app.tenancyType}</Badge>}
              {writeMode && (
                <button
                  className="btn-secondary text-sm"
                  onClick={() => {
                    setEditForm({ displayName: app.displayName || '', owner: app.owner || '', ownerEmail: app.ownerEmail || '' });
                    setFormError(null);
                    setShowEdit(true);
                  }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 flex gap-0">
            <TabButton active={tab === 'details'} onClick={() => setTab('details')}>Details</TabButton>
            <TabButton active={tab === 'deployments'} onClick={() => setTab('deployments')}>
              Deployments ({deployments?.items?.length ?? 0})
            </TabButton>
            <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
              Setting Definitions ({settingDefs?.items?.length ?? 0})
            </TabButton>
          </div>

          {/* ── Details tab ── */}
          {tab === 'details' && (
            <div className="card p-6">
              <dl className="divide-y divide-gray-200">
                <InfoRow label="ID" value={<span className="font-mono">{app.id}</span>} />
                <InfoRow label="Name" value={app.name} />
                <InfoRow label="Display Name" value={app.displayName} />
                <InfoRow label="Owner" value={app.owner} />
                <InfoRow label="Owner Email" value={app.ownerEmail} />
                <InfoRow label="Tenancy Type" value={app.tenancyType} />
                <InfoRow label="Group ID" value={app.groupId} />
                <InfoRow label="Public" value={app.isPublic ? 'Yes' : 'No'} />
                <InfoRow label="Shared" value={app.isShared ? 'Yes' : 'No'} />
                <InfoRow label="Customer Developed" value={app.isCustomerDeveloped ? 'Yes' : 'No'} />
                <InfoRow label="Created By" value={app.createdBy} />
                <InfoRow label="Created On" value={app.createdOn ? new Date(app.createdOn).toLocaleString() : null} />
                <InfoRow label="Modified By" value={app.modifiedBy} />
                <InfoRow label="Modified On" value={app.modifiedOn ? new Date(app.modifiedOn).toLocaleString() : null} />
              </dl>
            </div>
          )}

          {/* ── Deployments tab ── */}
          {tab === 'deployments' && (
            <div className="card overflow-hidden">
              {!deployments?.items?.length ? (
                <div className="py-12 text-center text-gray-500">No deployments found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Deployment ID', 'Planet', 'Class', 'Galaxy', 'Project', 'Last Request'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deployments.items.map((dep) => (
                      <tr key={dep.id} className="table-row-hover">
                        <td className="px-6 py-4 text-sm font-mono text-gray-800">{dep.deploymentId}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{dep.planet ?? '—'}</td>
                        <td className="px-6 py-4">
                          {dep.planetClass ? <Badge variant="indigo">{dep.planetClass}</Badge> : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{dep.galaxy ?? '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{dep.project ?? '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {dep.lastClientRequest ? new Date(dep.lastClientRequest).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Setting Definitions tab ── */}
          {tab === 'settings' && (
            <div className="card overflow-hidden">
              {!settingDefs?.items?.length ? (
                <div className="py-12 text-center text-gray-500">No setting definitions found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Setting Name', 'Description', 'Secret', 'GW Managed', 'Modified On'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settingDefs.items.map((sd) => (
                      <tr key={sd.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">{sd.settingName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sd.settingDescription ?? '—'}</td>
                        <td className="px-6 py-4">
                          {sd.isSecret
                            ? <Badge variant="red">Secret{sd.secretType ? ` (${sd.secretType})` : ''}</Badge>
                            : <Badge variant="gray">Plain</Badge>
                          }
                        </td>
                        <td className="px-6 py-4">
                          {sd.isGuidewireManaged
                            ? <Badge variant="purple">GW Managed</Badge>
                            : <Badge variant="gray">No</Badge>
                          }
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {sd.modifiedOn ? new Date(sd.modifiedOn).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Quick link to setting values */}
          <div className="mt-4">
            <Link
              to={`/setting-values?application=${encodeURIComponent(app.name)}`}
              className="btn-secondary"
            >
              View Setting Values for this Application →
            </Link>
          </div>
        </>
      )}

      {/* Edit Application modal */}
      <FormModal
        open={showEdit}
        title={`Edit Application: ${app?.name}`}
        onClose={() => setShowEdit(false)}
        onSubmit={() => setPendingEdit(true)}
        submitting={editSubmitting}
        submitLabel="Save"
      >
        {formError && <ErrorAlert message={formError} />}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input className="input" value={editForm.displayName} onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner <span className="text-red-500">*</span></label>
            <input className="input" required value={editForm.owner} onChange={(e) => setEditForm((f) => ({ ...f, owner: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email <span className="text-red-500">*</span></label>
            <input className="input" type="email" required value={editForm.ownerEmail} onChange={(e) => setEditForm((f) => ({ ...f, ownerEmail: e.target.value }))} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={pendingEdit}
        title="Save Application Changes"
        message={`Update application "${app?.name}" with new owner "${editForm.owner}"?`}
        confirmLabel="Save"
        onConfirm={async () => {
          setEditSubmitting(true);
          setFormError(null);
          try {
            const updated = await updateApplication(id, editForm);
            setApp(updated);
            setShowEdit(false);
            setPendingEdit(false);
          } catch (err) {
            setFormError(err.message);
          } finally {
            setEditSubmitting(false);
          }
        }}
        onCancel={() => setPendingEdit(false)}
      />
    </div>
  );
}
