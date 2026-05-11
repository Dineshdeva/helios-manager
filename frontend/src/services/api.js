/**
 * BFF API service layer
 *
 * All browser → BFF calls go through this module.
 * Never calls Helios directly — the BFF holds the OAuth token.
 *
 * API mapping comments show the full chain:
 *   UI action → BFF endpoint → Helios operationId
 */
import axios from 'axios';

// Vite dev server proxies /bff → http://localhost:3001/bff
// In production set VITE_BFF_URL to the deployed BFF origin.
const BASE_URL = import.meta.env.VITE_BFF_URL || '/bff';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send the HttpOnly session cookie with every request
});

// Unwrap data and normalize error messages
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred';
    const status = err.response?.status;
    const error = new Error(message);
    error.status = status;
    // Expose loginUrl for 401 responses so the UI can redirect
    error.loginUrl = err.response?.data?.error?.loginUrl || null;
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
// GET /bff/auth/status — is there a live session?
export const getAuthStatus = () =>
  axios.get('/bff/auth/status', { withCredentials: true }).then((r) => r.data);

// POST /bff/auth/logout — destroy the BFF session
export const postLogout = () =>
  axios.post('/bff/auth/logout', {}, { withCredentials: true }).then((r) => r.data);

// ── Write-ops flag ────────────────────────────────────────────────────────────
// UI: write-mode toggle → GET /bff/write-enabled → server ENABLE_WRITE_OPS flag
export const getWriteEnabled = () => client.get('/write-enabled');

// ── Current user ──────────────────────────────────────────────────────────────
// UI: top-bar user chip → GET /bff/whoami → Helios: getCurrentUserInfo
export const getWhoami = (tenantId) =>
  client.get('/whoami', { params: tenantId ? { tenantId } : {} });

// ── Tenants ───────────────────────────────────────────────────────────────────
// UI: tenant search bar → GET /bff/tenants → Helios: getAllTenants
export const getTenants = ({ name, pageSize, nextPageToken } = {}) =>
  client.get('/tenants', { params: { name, pageSize, nextPageToken } });

// UI: tenant row click → GET /bff/tenants/:id → Helios: getTenant
export const getTenant = (id) => client.get(`/tenants/${id}`);

// UI: Create Tenant form (write mode) → POST /bff/tenants → Helios: createTenant
export const createTenant = (body) => client.post('/tenants', body);

// UI: Edit Tenant form (write mode) → PUT /bff/tenants/:id → Helios: updateTenant
export const updateTenant = (id, body) => client.put(`/tenants/${id}`, body);

// ── Applications ──────────────────────────────────────────────────────────────
// UI: application search → GET /bff/applications → Helios: getAllApplications
export const getApplications = ({ name, tenantId, pageSize, nextPageToken } = {}) =>
  client.get('/applications', { params: { name, tenantId, pageSize, nextPageToken } });

// UI: application row click → GET /bff/applications/:id → Helios: getApplication
export const getApplication = (id, tenantId) =>
  client.get(`/applications/${id}`, { params: tenantId ? { tenantId } : {} });

// UI: roles tab → GET /bff/applications/:id/roles → Helios: getApplicationRoles
export const getApplicationRoles = (id, tenantId) =>
  client.get(`/applications/${id}/roles`, { params: tenantId ? { tenantId } : {} });

// UI: deployments tab → GET /bff/applications/:id/deployments → Helios: getAllDeployments
export const getDeployments = (appId, { tenantId, pageSize, nextPageToken } = {}) =>
  client.get(`/applications/${appId}/deployments`, {
    params: { tenantId, pageSize, nextPageToken },
  });

// UI: deployment row → GET /bff/applications/:id/deployments/:depId → Helios: getDeployment
export const getDeployment = (appId, depId, tenantId) =>
  client.get(`/applications/${appId}/deployments/${depId}`, {
    params: tenantId ? { tenantId } : {},
  });

// UI: setting defs tab → GET /bff/applications/:id/setting-definitions → Helios: getAllApplicationSettingDefinitions
export const getSettingDefinitions = (appId, { tenantId, pageSize, nextPageToken } = {}) =>
  client.get(`/applications/${appId}/setting-definitions`, {
    params: { tenantId, pageSize, nextPageToken },
  });

// UI: setting def row → GET /bff/applications/:id/setting-definitions/:sdId → Helios: getApplicationSettingDefinition
export const getSettingDefinition = (appId, sdId, tenantId) =>
  client.get(`/applications/${appId}/setting-definitions/${sdId}`, {
    params: tenantId ? { tenantId } : {},
  });

// UI: Create Application form (write mode) → POST /bff/applications → Helios: createApplication
export const createApplication = (body, tenantId) =>
  client.post('/applications', body, { params: tenantId ? { tenantId } : {} });

// UI: Edit Application form (write mode) → PUT /bff/applications/:id → Helios: updateApplication
export const updateApplication = (id, body, tenantId) =>
  client.put(`/applications/${id}`, body, { params: tenantId ? { tenantId } : {} });

// ── Setting Values ────────────────────────────────────────────────────────────
// UI: setting values search → GET /bff/setting-values → Helios: getAllSettingValues
export const getSettingValues = ({
  tenantId,
  applicationId,
  name,
  pageSize,
  nextPageToken,
} = {}) =>
  client.get('/setting-values', {
    params: { tenantId, applicationId, name, pageSize, nextPageToken },
  });

// UI: setting value row → GET /bff/setting-values/:id → Helios: getSettingValue
export const getSettingValue = (id, tenantId) =>
  client.get(`/setting-values/${id}`, { params: tenantId ? { tenantId } : {} });

// UI: history tab → GET /bff/setting-values/:id/history → Helios: executeHistoryQuery
export const getSettingValueHistory = (id, tenantId) =>
  client.get(`/setting-values/${id}/history`, {
    params: tenantId ? { tenantId } : {},
  });

// UI: Create Setting Value form (write mode) → POST /bff/setting-values → Helios: createSettingValue
export const createSettingValue = (body, tenantId) =>
  client.post('/setting-values', body, { params: tenantId ? { tenantId } : {} });

// UI: Edit Setting Value form (write mode) → PUT /bff/setting-values/:id → Helios: updateSettingValue
export const updateSettingValue = (id, body, tenantId) =>
  client.put(`/setting-values/${id}`, body, { params: tenantId ? { tenantId } : {} });
