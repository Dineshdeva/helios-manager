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
 *
 * UI action: "Create Application" form submit (write mode only)
 *   → BFF  POST /bff/applications
 *   → Helios operationId: createApplication  (POST /v1/applications)
 *
 * UI action: "Save" in application edit form (write mode only)
 *   → BFF  PUT /bff/applications/:id
 *   → Helios operationId: updateApplication  (PUT /v1/applications/{applicationId})
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapApplication, mapDeployment } = require('../dto');
const { validateId, validateDeploymentId } = require('../utils/sanitize');

async function listApplications(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data, headers } = await client.get('/v1/applications', {
      params: {
        application: req.query.application || req.query.name || undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
        nextPageToken: req.query.nextPageToken || undefined,
      },
    });
    const list = Array.isArray(data) ? data : (data.data || []);
    const nextTokenFromHeader = headers?.['x-gwre-next-page-token'] || null;
    res.json({
      items: list.map(mapApplication),
      nextPageToken: (Array.isArray(data) ? nextTokenFromHeader : data.nextPageToken) || null,
      totalCount: data.totalCount ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getApplication(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/applications/${id}`);
    res.json(mapApplication(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function getApplicationRoles(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(`/v1/applications/${id}/roles`);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function listDeployments(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${id}/deployments`,
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
    const id = validateId(req.params.id, 'applicationId');
    const depId = validateDeploymentId(req.params.depId, 'deploymentId');
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get(
      `/v1/applications/${id}/deployments/${depId}`
    );
    res.json(mapDeployment(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function createApplication(req, res, next) {
  try {
    const { name, displayName, owner, ownerEmail, tenancyType } = req.body;
    if (!name || !owner || !ownerEmail) {
      return next(
        Object.assign(new Error('name, owner, and ownerEmail are required'), { status: 400 })
      );
    }
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.post('/v1/applications', {
      name,
      displayName: displayName || undefined,
      owner,
      ownerEmail,
      tenancyType: tenancyType || undefined,
    });
    res.status(201).json(mapApplication(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function updateApplication(req, res, next) {
  try {
    const id = validateId(req.params.id, 'applicationId');
    const { displayName, owner, ownerEmail, version } = req.body;
    if (!owner || !ownerEmail) {
      return next(
        Object.assign(new Error('owner and ownerEmail are required'), { status: 400 })
      );
    }
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.put(`/v1/applications/${id}`, {
      displayName: displayName || undefined,
      owner,
      ownerEmail,
      version,
    });
    res.json(mapApplication(data.data || data));
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
  createApplication,
  updateApplication,
};
