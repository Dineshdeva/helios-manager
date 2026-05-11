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
});

// Unwrap data and normalise error messages
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

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

// UI: deployment row click → GET /bff/applications/:id/deployments/:depId → Helios: getDeployment
export const getDeployment = (appId, depId, tenantId) =>
  client.get(`/applications/${appId}/deployments/${depId}`, {
    params: tenantId ? { tenantId } : {},
  });

// UI: setting defs tab → GET /bff/applications/:id/setting-definitions → Helios: getAllApplicationSettingDefinitions
export const getSettingDefinitions = (appId, { tenantId, pageSize, nextPageToken } = {}) =>
  client.get(`/applications/${appId}/setting-definitions`, {
    params: { tenantId, pageSize, nextPageToken },
  });

// UI: setting def row click → GET /bff/applications/:id/setting-definitions/:sdId → Helios: getApplicationSettingDefinition
export const getSettingDefinition = (appId, sdId, tenantId) =>
  client.get(`/applications/${appId}/setting-definitions/${sdId}`, {
    params: tenantId ? { tenantId } : {},
  });

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

// UI: setting value row click → GET /bff/setting-values/:id → Helios: getSettingValue
export const getSettingValue = (id, tenantId) =>
  client.get(`/setting-values/${id}`, { params: tenantId ? { tenantId } : {} });

// UI: history tab → GET /bff/setting-values/:id/history → Helios: executeHistoryQuery
export const getSettingValueHistory = (id, tenantId) =>
  client.get(`/setting-values/${id}/history`, {
    params: tenantId ? { tenantId } : {},
  });
