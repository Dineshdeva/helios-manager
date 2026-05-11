/**
 * Helios Manager — Backend-for-Frontend (BFF)
 *
 * Wraps the Guidewire Helios (Settings Vault) REST APIs and:
 *  • Handles OAuth2 Authorization Code + PKCE login (token never leaves this process)
 *  • Falls back to client-credentials for headless/CI use
 *  • Exposes read-only BFF endpoints (write ops opt-in via ENABLE_WRITE_OPS)
 *  • Centralised audit logging and error handling
 */
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const { login, callback, logout, status } = require('./auth/oauthHandler');
const { sessionAuthMiddleware } = require('./middleware/sessionAuth');
const { auditLog } = require('./middleware/audit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontend.url,
    credentials: true, // required so the browser sends the session cookie
  })
);
app.use(express.json());
app.use(morgan('combined'));

// ── Session ───────────────────────────────────────────────────────────────────
// MemoryStore is fine for a single-node internal tool.
// Swap in connect-redis / connect-pg-simple for multi-node or production use.
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,            // never readable by JS in the browser
      // Mark cookies as Secure when the server knows it is serving HTTPS.
      // COOKIE_SECURE=true must be set explicitly in production (e.g. behind a
      // TLS-terminating reverse proxy where NODE_ENV alone is insufficient).
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 h session lifetime
    },
  })
);

// ── Health check (unauthenticated) ───────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'helios-manager-bff' })
);

// ── OAuth2 routes (unauthenticated — part of the login handshake) ────────────
app.get('/bff/auth/login', login);
app.get('/bff/auth/callback', callback);
app.post('/bff/auth/logout', logout);
app.get('/bff/auth/status', status);

// ── BFF data routes (audit → session/OAuth token → business logic) ────────────
app.use('/bff', auditLog, sessionAuthMiddleware, routes);

// ── Centralised error handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[BFF] Helios Manager running on http://localhost:${config.port}`);
  console.log(`[BFF] Helios base URL  : ${config.helios.baseUrl}`);
  console.log(`[BFF] Login URL        : http://localhost:${config.port}/bff/auth/login`);
  console.log(`[BFF] Write ops        : ${config.enableWriteOps ? 'ENABLED' : 'disabled'}`);
});

module.exports = app;
