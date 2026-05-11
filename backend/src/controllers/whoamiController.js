/**
 * Whoami controller
 *
 * UI action: "Who am I?" banner
 *   → BFF  GET /bff/whoami
 *   → Helios operationId: getCurrentUserInfo  (GET /v1/whoami)
 */
const { createHeliosClient } = require('../clients/heliosClient');

async function getCurrentUser(req, res, next) {
  try {
    // GW-Tenant is optional for whoami; pass it through if the caller supplies it
    const client = createHeliosClient(req.heliosToken, req.query.tenantId);
    const { data } = await client.get('/v1/whoami');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrentUser };
