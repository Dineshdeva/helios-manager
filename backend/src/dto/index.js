/**
 * Response DTOs — shape the data returned to the frontend.
 *
 * Goals:
 *  1. Expose only fields the UI needs (no internal Helios implementation details).
 *  2. Mask secret setting values so they never reach the browser.
 *  3. Provide a stable contract independent of upstream schema changes.
 */

/**
 * @typedef {object} TenantDTO
 * Maps Helios `Tenant` schema → client-safe DTO.
 */
function mapTenant(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    isTestData: tenant.isTestData ?? false,
    createdBy: tenant.createdBy,
    createdOn: tenant.createdOn,
    modifiedBy: tenant.modifiedBy,
    modifiedOn: tenant.modifiedOn,
  };
}

/**
 * @typedef {object} ApplicationDTO
 * Maps Helios `Application` schema → client-safe DTO.
 */
function mapApplication(app) {
  return {
    id: app.id,
    name: app.name,
    displayName: app.displayName || app.name,
    owner: app.owner,
    ownerEmail: app.ownerEmail,
    isPublic: app.isPublic ?? false,
    isShared: app.isShared ?? false,
    isCustomerDeveloped: app.isCustomerDeveloped ?? false,
    tenancyType: app.tenancyType,
    groupId: app.groupId,
    createdBy: app.createdBy,
    createdOn: app.createdOn,
    modifiedBy: app.modifiedBy,
    modifiedOn: app.modifiedOn,
  };
}

/**
 * @typedef {object} SettingValueDTO
 * Maps Helios `SettingValue` schema → client-safe DTO.
 * Secret values are REDACTED and never sent to the browser.
 */
function mapSettingValue(sv) {
  const isSecret = sv.isSecret || false;
  return {
    id: sv.id,
    applicationId: sv.applicationId,
    name: sv.name,
    // Never expose secret values to the frontend
    value: isSecret ? '***REDACTED***' : sv.value,
    isSecret,
    comment: sv.comment,
    isTenantSpecific: sv.isTenantSpecific ?? true,
    applyTo: sv.applyTo,
    createdBy: sv.createdBy,
    createdOn: sv.createdOn,
    modifiedBy: sv.modifiedBy,
    modifiedOn: sv.modifiedOn,
  };
}

/**
 * @typedef {object} SettingDefinitionDTO
 * Maps Helios `SettingDefinitionResponse` schema → client-safe DTO.
 */
function mapSettingDefinition(sd) {
  return {
    id: sd.id,
    settingName: sd.settingName,
    settingDescription: sd.settingDescription,
    isSecret: sd.isSecret ?? false,
    secretType: sd.secretType,
    isGuidewireManaged: sd.isGuidewireManaged ?? false,
    isTenantSpecific: sd.isTenantSpecific ?? false,
    createdBy: sd.createdBy,
    createdOn: sd.createdOn,
    modifiedBy: sd.modifiedBy,
    modifiedOn: sd.modifiedOn,
  };
}

/**
 * @typedef {object} DeploymentDTO
 * Maps Helios `Deployment` schema → client-safe DTO.
 */
function mapDeployment(dep) {
  return {
    id: dep.id,
    deploymentId: dep.deploymentId,
    description: dep.description,
    planet: dep.planet,
    planetClass: dep.planetClass,
    galaxy: dep.galaxy,
    supercluster: dep.supercluster,
    quadrant: dep.quadrant,
    project: dep.project,
    lastClientRequest: dep.lastClientRequest,
    createdBy: dep.createdBy,
    createdOn: dep.createdOn,
  };
}

module.exports = {
  mapTenant,
  mapApplication,
  mapSettingValue,
  mapSettingDefinition,
  mapDeployment,
};
