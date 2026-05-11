/**
 * Helios API client factory.
 *
 * Creates a pre-configured Axios instance that:
 *  - Targets the Helios base URL (/api prefix as per the OpenAPI spec servers block)
 *  - Attaches the Bearer token obtained by the auth middleware
 *  - Forwards GW-Tenant if a tenantId is supplied
 *  - Normalises upstream errors into standard JS Error objects with a `.status`
 */
const axios = require('axios');
const config = require('../config');

/**
 * @param {string} token   OAuth access token
 * @param {string} [tenantId]  Optional GW-Tenant header value
 * @returns {import('axios').AxiosInstance}
 */
function createHeliosClient(token, tenantId) {
  const instance = axios.create({
    baseURL: `${config.helios.baseUrl}/api`,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(tenantId ? { 'GW-Tenant': tenantId } : {}),
    },
  });

  // Normalise upstream errors so controllers never deal with raw Axios errors
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      const upstreamStatus = err.response?.status;
      const upstreamMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;

      const wrapped = Object.assign(new Error(upstreamMessage), {
        status: upstreamStatus || 502,
        response: err.response,
      });

      return Promise.reject(wrapped);
    }
  );

  return instance;
}

module.exports = { createHeliosClient };
