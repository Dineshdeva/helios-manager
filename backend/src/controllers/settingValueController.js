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
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapSettingValue } = require('../dto');

async function listSettingValues(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get('/v1/setting-values', {
      params: {
        applicationId: req.query.applicationId || undefined,
        name: req.query.name || undefined,
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
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/setting-values/${req.params.id}`);
    res.json(mapSettingValue(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function getSettingValueHistory(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/setting-values/${req.params.id}/history`
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSettingValues, getSettingValue, getSettingValueHistory };
