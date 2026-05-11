/**
 * Setting Value controller
 *
 * UI action: Search / filter setting values
 *   → BFF  GET /bff/setting-values?tenantId=&applicationId=&name=&pageSize=&nextPageToken=
 *   → Helios operationId: getAllSettingValues  (GET /v1/setting-values)
 *
 * UI action: Click setting value row → detail view
 *   → BFF  GET /bff/setting-values/:id?tenantId=
 *   → Helios operationId: getSettingValue  (GET /v1/setting-values/{settingValueId})
 *
 * UI action: View audit history for a setting value
 *   → BFF  GET /bff/setting-values/:id/history?tenantId=
 *   → Helios operationId: executeHistoryQuery
 *       (GET /v1/setting-values/{settingValueId}/history)
 *
 * UI action: "Create Setting Value" form submit (write mode only)
 *   → BFF  POST /bff/setting-values
 *   → Helios operationId: createSettingValue  (POST /v1/setting-values)
 *
 * UI action: "Save" in setting value edit form (write mode only)
 *   → BFF  PUT /bff/setting-values/:id
 *   → Helios operationId: updateSettingValue  (PUT /v1/setting-values/{settingValueId})
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapSettingValue } = require('../dto');
const { validateId } = require('../utils/sanitize');

async function listSettingValues(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get('/v1/setting-values', {
      params: {
        application: req.query.application || req.query.applicationId || undefined,
        setting: req.query.setting || req.query.name || undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
        nextPageToken: req.query.nextPageToken || undefined,
      },
    });
    res.json({
      items: (data.data || []).map(mapSettingValue),
      nextPageToken: data.nextPageToken || null,
      totalCount: data.totalCount ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getSettingValue(req, res, next) {
  try {
    const id = validateId(req.params.id, 'settingValueId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/setting-values/${id}`);
    res.json(mapSettingValue(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function getSettingValueHistory(req, res, next) {
  try {
    const id = validateId(req.params.id, 'settingValueId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/setting-values/${id}/history`
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createSettingValue(req, res, next) {
  try {
    const { applicationId, name, value, comment, applyTo, isTenantSpecific } = req.body;
    if (!applicationId || !name || value === undefined || value === null || !applyTo) {
      return next(
        Object.assign(
          new Error('applicationId, name, value, and applyTo are required'),
          { status: 400 }
        )
      );
    }
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.post('/v1/setting-values', {
      applicationId,
      name,
      value: String(value),
      comment: comment || undefined,
      applyTo,
      isTenantSpecific: isTenantSpecific !== undefined ? isTenantSpecific : true,
    });
    res.status(201).json(mapSettingValue(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function updateSettingValue(req, res, next) {
  try {
    const id = validateId(req.params.id, 'settingValueId');
    const { value, comment, version } = req.body;
    if (value === undefined || value === null) {
      return next(Object.assign(new Error('value is required'), { status: 400 }));
    }
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.put(`/v1/setting-values/${id}`, {
      value: String(value),
      comment: comment || undefined,
      version,
    });
    res.json(mapSettingValue(data.data || data));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSettingValues,
  getSettingValue,
  getSettingValueHistory,
  createSettingValue,
  updateSettingValue,
};
