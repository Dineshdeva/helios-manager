/**
 * Application controller
 *
 * UI action: Search applications
 *   → BFF  GET /bff/applications?name=&tenantId=&pageSize=&nextPageToken=
 *   → Helios operationId: getAllApplications  (GET /v1/applications)
 *
 * UI action: Click application row → detail view
 *   → BFF  GET /bff/applications/:id?tenantId=
 *   → Helios operationId: getApplication  (GET /v1/applications/{applicationId})
 *
 * UI action: View application roles tab
 *   → BFF  GET /bff/applications/:id/roles?tenantId=
 *   → Helios operationId: getApplicationRoles  (GET /v1/applications/{applicationId}/roles)
 *
 * UI action: View deployments tab
 *   → BFF  GET /bff/applications/:id/deployments?tenantId=
 *   → Helios operationId: getAllDeployments  (GET /v1/applications/{applicationId}/deployments)
 *
 * UI action: Click deployment row → deployment detail
 *   → BFF  GET /bff/applications/:id/deployments/:depId?tenantId=
 *   → Helios operationId: getDeployment  (GET /v1/applications/{applicationId}/deployments/{deploymentId})
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapApplication, mapDeployment } = require('../dto');

async function listApplications(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get('/v1/applications', {
      params: {
        name: req.query.name || undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
        nextPageToken: req.query.nextPageToken || undefined,
      },
    });
    res.json({
      items: (data.data || []).map(mapApplication),
      nextPageToken: data.nextPageToken || null,
      totalCount: data.totalCount ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getApplication(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/applications/${req.params.id}`);
    res.json(mapApplication(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function getApplicationRoles(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/applications/${req.params.id}/roles`);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function listDeployments(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${req.params.id}/deployments`,
      {
        params: {
          pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
          nextPageToken: req.query.nextPageToken || undefined,
        },
      }
    );
    res.json({
      items: (data.data || []).map(mapDeployment),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    next(err);
  }
}

async function getDeployment(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${req.params.id}/deployments/${req.params.depId}`
    );
    res.json(mapDeployment(data.data || data));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listApplications,
  getApplication,
  getApplicationRoles,
  listDeployments,
  getDeployment,
};
