const { Router } = require('express');

const { writeGuard } = require('../middleware/writeGuard');
const { getCurrentUser } = require('../controllers/whoamiController');
const { listTenants, getTenant, createTenant, updateTenant } = require('../controllers/tenantController');
const {
  listApplications,
  getApplication,
  getApplicationRoles,
  listDeployments,
  getDeployment,
  createApplication,
  updateApplication,
} = require('../controllers/applicationController');
const {
  listSettingDefinitions,
  getSettingDefinition,
} = require('../controllers/settingDefinitionController');
const {
  listSettingValues,
  getSettingValue,
  getSettingValueHistory,
  createSettingValue,
  updateSettingValue,
} = require('../controllers/settingValueController');

const router = Router();

// ── Whoami ──────────────────────────────────────────────────────────────────
router.get('/whoami', getCurrentUser);

// ── Write-ops status ─────────────────────────────────────────────────────────
// Lets the frontend discover whether write mode is enabled without a failed request.
const config = require('../config');
router.get('/write-enabled', (_req, res) =>
  res.json({ enabled: config.enableWriteOps })
);

// ── Tenants ──────────────────────────────────────────────────────────────────
router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenant);
// Write (gated)
router.post('/tenants', writeGuard, createTenant);
router.put('/tenants/:id', writeGuard, updateTenant);

// ── Applications ─────────────────────────────────────────────────────────────
router.get('/applications', listApplications);
router.get('/applications/:id', getApplication);
router.get('/applications/:id/roles', getApplicationRoles);
router.get('/applications/:id/deployments', listDeployments);
router.get('/applications/:id/deployments/:depId', getDeployment);
router.get('/applications/:id/setting-definitions', listSettingDefinitions);
router.get('/applications/:id/setting-definitions/:sdId', getSettingDefinition);
// Write (gated)
router.post('/applications', writeGuard, createApplication);
router.put('/applications/:id', writeGuard, updateApplication);

// ── Setting Values ────────────────────────────────────────────────────────────
router.get('/setting-values', listSettingValues);
router.get('/setting-values/:id', getSettingValue);
router.get('/setting-values/:id/history', getSettingValueHistory);
// Write (gated)
router.post('/setting-values', writeGuard, createSettingValue);
router.put('/setting-values/:id', writeGuard, updateSettingValue);

module.exports = router;
