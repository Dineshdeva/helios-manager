/**
 * Tenant controller
 *
 * UI action: Search tenants search bar
 *   → BFF  GET /bff/tenants?name=&pageSize=&nextPageToken=
 *   → Helios operationId: getAllTenants  (GET /v1/tenants)
 *
 * UI action: Click tenant row → detail view
 *   → BFF  GET /bff/tenants/:id
 *   → Helios operationId: getTenant  (GET /v1/tenants/{tenantId})
 *
 * UI action: "Create Tenant" form submit (write mode only)
 *   → BFF  POST /bff/tenants
 *   → Helios operationId: createTenant  (POST /v1/tenants)
 *
 * UI action: "Save" in tenant edit form (write mode only)
 *   → BFF  PUT /bff/tenants/:id
 *   → Helios operationId: updateTenant  (PUT /v1/tenants/{tenantId})
 */
const { createHeliosClient } = require('../clients/heliosClient');
const { mapTenant } = require('../dto');
const { validateId } = require('../utils/sanitize');

async function listTenants(req, res, next) {
  try {
    const client = createHeliosClient(req.heliosToken);
    const { data } = await client.get('/v1/tenants', {
      params: {
        name: req.query.name || undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
        nextPageToken: req.query.nextPageToken || undefined,
      },
    });
    res.json({
      items: (data.data || []).map(mapTenant),
      nextPageToken: data.nextPageToken || null,
      totalCount: data.totalCount ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getTenant(req, res, next) {
  try {
    const id = validateId(req.params.id, 'tenantId');
    const client = createHeliosClient(req.heliosToken);
    const { data } = await client.get(`/v1/tenants/${id}`);
    res.json(mapTenant(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function createTenant(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return next(Object.assign(new Error('name is required'), { status: 400 }));
    }
    const client = createHeliosClient(req.heliosToken);
    const { data } = await client.post('/v1/tenants', { name: name.trim() });
    res.status(201).json(mapTenant(data.data || data));
  } catch (err) {
    next(err);
  }
}

async function updateTenant(req, res, next) {
  try {
    const id = validateId(req.params.id, 'tenantId');
    const { name, version } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return next(Object.assign(new Error('name is required'), { status: 400 }));
    }
    const client = createHeliosClient(req.heliosToken);
    const { data } = await client.put(`/v1/tenants/${id}`, {
      name: name.trim(),
      version,
    });
    res.json(mapTenant(data.data || data));
  } catch (err) {
    next(err);
  }
}

module.exports = { listTenants, getTenant, createTenant, updateTenant };
