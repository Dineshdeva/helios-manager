/**
 * Session-aware authentication middleware
 *
 * Priority order for obtaining a Helios access token:
 *
 *   1. Session token  — set after a successful Authorization Code + PKCE login.
 *                       Preferred; provides proper user-level attribution.
 *
 *   2. Client credentials — automatic service-account token, used when
 *                           HELIOS_CLIENT_SECRET is configured and no session
 *                           token exists (CI / headless environments).
 *
 *   3. 401 Unauthenticated — neither path is available; the frontend should
 *                             prompt the user to click Authorize.
 */
const config = require('../config');
const { getAccessToken } = require('./auth');

async function sessionAuthMiddleware(req, res, next) {
  // ── 1. Session token ───────────────────────────────────────────────────────
  if (
    req.session?.accessToken &&
    Date.now() < (req.session.tokenExpiresAt || 0)
  ) {
    req.heliosToken = req.session.accessToken;
    // Expose the authenticated user to audit logging
    req.authenticatedUser = req.session.userInfo?.email || req.session.userInfo?.sub || 'session-user';
    return next();
  }

  // ── 2. Client credentials fallback ────────────────────────────────────────
  if (config.helios.clientId && config.helios.clientSecret) {
    try {
      req.heliosToken = await getAccessToken();
      req.authenticatedUser = `client:${config.helios.clientId}`;
      return next();
    } catch (err) {
      return next(
        Object.assign(
          new Error(`Failed to obtain access token: ${err.message}`),
          { status: 502 }
        )
      );
    }
  }

  // ── 3. Not authenticated ───────────────────────────────────────────────────
  res.status(401).json({
    error: {
      status: 401,
      message: 'Not authenticated. Click Authorize to log in.',
      loginUrl: '/bff/auth/login',
    },
  });
}

module.exports = { sessionAuthMiddleware };
