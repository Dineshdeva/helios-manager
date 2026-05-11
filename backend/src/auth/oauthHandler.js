/**
 * OAuth2 Authorization Code + PKCE handler
 *
 * Mirrors what the Helios Swagger UI "Authorize" button does, but keeps the
 * access token on the server inside an express-session. The browser never
 * sees the token — it only holds a signed, HttpOnly session cookie.
 *
 * Flow:
 *   1. GET /bff/auth/login
 *        BFF generates PKCE verifier/challenge + state → stores in session
 *        → redirects browser to Okta authorization URL
 *
 *   2. User authenticates in Okta
 *        → Okta redirects to GET /bff/auth/callback?code=…&state=…
 *
 *   3. BFF validates state, exchanges code+verifier for tokens
 *        → stores access_token in session
 *        → redirects browser back to frontend (?auth=success)
 */
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier() {
  // 32 random bytes → 43-char base64url string (within the 43–128 char range)
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * GET /bff/auth/login
 * Kicks off the Authorization Code + PKCE flow.
 */
function login(req, res) {
  if (!config.helios.clientId) {
    return res.status(500).json({
      error: { status: 500, message: 'HELIOS_CLIENT_ID is not configured on the server.' },
    });
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Persist PKCE state in the session so the callback can validate/use it
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;
  // Remember where to send the user after a successful login
  req.session.returnTo = req.query.returnTo || config.frontend.url;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.helios.clientId,
    redirect_uri: config.helios.redirectUri,
    scope: config.helios.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  res.redirect(`${config.helios.authorizationUrl}?${params.toString()}`);
}

/**
 * GET /bff/auth/callback
 * Okta redirects here after the user authenticates.
 */
async function callback(req, res) {
  const { code, state, error, error_description } = req.query;

  const frontendBase = config.frontend.url;

  if (error) {
    return res.redirect(
      `${frontendBase}?auth=error&message=${encodeURIComponent(error_description || error)}`
    );
  }

  // ── CSRF protection: validate state ──────────────────────────────────────
  if (!state || state !== req.session.oauthState) {
    return res.redirect(
      `${frontendBase}?auth=error&message=${encodeURIComponent(
        'Authorization failed: invalid state parameter (possible CSRF).'
      )}`
    );
  }

  const codeVerifier = req.session.codeVerifier;
  if (!codeVerifier) {
    return res.redirect(
      `${frontendBase}?auth=error&message=${encodeURIComponent(
        'Authorization failed: missing PKCE code verifier.'
      )}`
    );
  }

  try {
    // ── Exchange authorization code for tokens ──────────────────────────────
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.helios.redirectUri,
      client_id: config.helios.clientId,
      code_verifier: codeVerifier,
      // client_secret is optional — some Okta apps are confidential clients
      ...(config.helios.clientSecret
        ? { client_secret: config.helios.clientSecret }
        : {}),
    });

    const tokenResponse = await axios.post(
      config.helios.tokenUrl,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in, id_token } = tokenResponse.data;

    // ── Store token server-side (never sent to the browser) ────────────────
    req.session.accessToken = access_token;
    req.session.tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;

    // Extract user info from the ID token payload (display only, no sig check)
    if (id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(id_token.split('.')[1], 'base64url').toString('utf8')
        );
        req.session.userInfo = {
          sub: payload.sub,
          email: payload.email || payload.preferred_username,
          name: payload.name,
        };
      } catch {
        // Non-critical — UI will fall back to "Authenticated"
      }
    }

    // Clean up PKCE state
    delete req.session.oauthState;
    delete req.session.codeVerifier;

    const returnTo = req.session.returnTo || frontendBase;
    delete req.session.returnTo;

    res.redirect(`${returnTo}?auth=success`);
  } catch (err) {
    const message =
      err.response?.data?.error_description ||
      err.response?.data?.error ||
      err.message;
    console.error('[AUTH] Token exchange failed:', message);
    res.redirect(
      `${frontendBase}?auth=error&message=${encodeURIComponent(message)}`
    );
  }
}

/**
 * POST /bff/auth/logout
 * Destroys the session (the Okta SSO session is NOT touched).
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH] Session destroy error:', err);
    }
    res.json({ message: 'Logged out successfully.' });
  });
}

/**
 * GET /bff/auth/status
 * Tells the frontend whether the user is authenticated (no token exposure).
 */
function status(req, res) {
  const authenticated =
    !!req.session.accessToken && Date.now() < (req.session.tokenExpiresAt || 0);

  res.json({
    authenticated,
    user: authenticated ? (req.session.userInfo ?? null) : null,
    // Let the frontend know whether the interactive login flow is available
    loginUrl: '/bff/auth/login',
  });
}

/**
 * POST /bff/auth/dev-token  (DEV ONLY — never mounted in production)
 * Allows a developer to manually seed an access token obtained from the
 * Helios Swagger UI "Authorize" dialog into the BFF session, bypassing the
 * OAuth redirect flow when the redirect URI cannot be registered in Okta.
 *
 * Usage:
 *   1. Open the Helios Swagger UI and click Authorize to get a token.
 *   2. Open DevTools → Network → copy the Bearer token from any API call.
 *   3. POST { "token": "<bearer-token>" } to this endpoint.
 *   4. The BFF session is now live — the frontend will show "Session active".
 *
 * Body: { token: string, expiresInSeconds?: number }
 */
function devSetToken(req, res) {
  const { token, expiresInSeconds } = req.body || {};
  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ error: { status: 400, message: 'token is required.' } });
  }
  const DEFAULT_DEV_TOKEN_TTL_SECONDS = 3600;
  const ttl = (typeof expiresInSeconds === 'number' && expiresInSeconds > 0)
    ? expiresInSeconds
    : DEFAULT_DEV_TOKEN_TTL_SECONDS;
  req.session.accessToken = token.trim();
  req.session.tokenExpiresAt = Date.now() + ttl * 1000;
  req.session.userInfo = { name: 'Dev (manual token)', email: null, sub: null };
  res.json({ ok: true, expiresAt: new Date(req.session.tokenExpiresAt).toISOString() });
}

module.exports = { login, callback, logout, status, devSetToken };
