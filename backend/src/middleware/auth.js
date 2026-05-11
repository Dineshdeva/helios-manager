/**
 * OAuth2 middleware — client credentials grant.
 *
 * Tokens are cached in-process and refreshed 60 s before expiry so that
 * no Helios request ever uses a stale token. The raw access_token is never
 * forwarded to the browser; it lives only in this server process.
 */
const axios = require('axios');
const config = require('../config');

let _tokenCache = { accessToken: null, expiresAt: 0 };

/**
 * Obtains (or returns a cached) OAuth access token using client credentials.
 * @returns {Promise<string>} Bearer token
 */
async function getAccessToken() {
  if (_tokenCache.accessToken && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.accessToken;
  }

  if (!config.helios.clientId || !config.helios.clientSecret) {
    throw Object.assign(
      new Error(
        'HELIOS_CLIENT_ID and HELIOS_CLIENT_SECRET must be set in environment variables.'
      ),
      { status: 500 }
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.helios.clientId,
    client_secret: config.helios.clientSecret,
    scope: config.helios.scopes,
  });

  const response = await axios.post(config.helios.tokenUrl, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token, expires_in } = response.data;

  // Refresh 60 s before actual expiry
  _tokenCache = {
    accessToken: access_token,
    expiresAt: Date.now() + (expires_in - 60) * 1000,
  };

  return access_token;
}

/**
 * Express middleware: attaches a valid Helios access token to req.heliosToken.
 */
async function authMiddleware(req, res, next) {
  try {
    req.heliosToken = await getAccessToken();
    next();
  } catch (err) {
    const wrapped = Object.assign(
      new Error(`Failed to obtain Helios access token: ${err.message}`),
      { status: 502 }
    );
    next(wrapped);
  }
}

module.exports = { authMiddleware, getAccessToken };
