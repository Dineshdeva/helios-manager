/**
 * Setting Definition controller
 *
 * UI action: Browse setting definitions for an application
 *   → BFF  GET /bff/applications/:id/setting-definitions?tenantId=&pageSize=&nextPageToken=
 *   → Helios operationId: getAllApplicationSettingDefinitions
 *       (GET /v1/applications/{applicationId}/setting-definitions)
 *
 * UI action: Click definition row → detail panel
 *   → BFF  GET /bff/applications/:id/setting-definitions/:sdId?tenantId=
 *   → Helios operationId: getApplicationSettingDefinition
 *       (GET /v1/applications/{applicationId}/setting-definitions/{settingDefinitionId})
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapSettingDefinition } = require('../dto');
const { validateId } = require('../utils/sanitize');

async function listSettingDefinitions(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${id}/setting-definitions`,
      {
        params: {
          pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
          nextPageToken: req.query.nextPageToken || undefined,
        },
      }
    );
    res.json({
      items: (data.data || []).map(mapSettingDefinition),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    next(err);
  }
}

async function getSettingDefinition(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const sdId = validateId(req.params.sdId, 'settingDefinitionId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${id}/setting-definitions/${sdId}`
    );
    res.json(mapSettingDefinition(data.data || data));
  } catch (err) {
    next(err);
  }
}

module.exports = { listSettingDefinitions, getSettingDefinition };
