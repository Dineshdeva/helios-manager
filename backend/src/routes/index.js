const { Router } = require('express');

const { getCurrentUser } = require('../controllers/whoamiController');
const { listTenants, getTenant } = require('../controllers/tenantController');
const {
  listApplications,
  getApplication,
  getApplicationRoles,
  listDeployments,
  getDeployment,
} = require('../controllers/applicationController');
const {
  listSettingDefinitions,
  getSettingDefinition,
} = require('../controllers/settingDefinitionController');
const {
  listSettingValues,
  getSettingValue,
  getSettingValueHistory,
} = require('../controllers/settingValueController');

const router = Router();

// ── Whoami ──────────────────────────────────────────────────────────────────
router.get('/whoami', getCurrentUser);

// ── Tenants ──────────────────────────────────────────────────────────────────
router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenant);

// ── Applications ─────────────────────────────────────────────────────────────
router.get('/applications', listApplications);
router.get('/applications/:id', getApplication);
router.get('/applications/:id/roles', getApplicationRoles);
router.get('/applications/:id/deployments', listDeployments);
router.get('/applications/:id/deployments/:depId', getDeployment);
router.get('/applications/:id/setting-definitions', listSettingDefinitions);
router.get('/applications/:id/setting-definitions/:sdId', getSettingDefinition);

// ── Setting Values ────────────────────────────────────────────────────────────
router.get('/setting-values', listSettingValues);
router.get('/setting-values/:id', getSettingValue);
router.get('/setting-values/:id/history', getSettingValueHistory);

module.exports = router;
