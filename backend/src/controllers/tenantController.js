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

module.exports = { listTenants, getTenant };
