/**
 * Helios Manager — Backend-for-Frontend (BFF)
 *
 * Wraps the Guidewire Helios (Settings Vault) REST APIs and:
 *  • Handles OAuth2 client-credentials token acquisition (token never leaves this process)
 *  • Exposes read-only BFF endpoints for the React frontend
 *  • Provides centralised audit logging and error handling
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const { authMiddleware } = require('./middleware/auth');
const { auditLog } = require('./middleware/audit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: config.frontend.url, credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

// ── Health check (unauthenticated) ───────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'helios-manager-bff' }));

// ── BFF routes (audit → OAuth → business logic) ──────────────────────────────
app.use('/bff', auditLog, authMiddleware, routes);

// ── Centralised error handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[BFF] Helios Manager running on http://localhost:${config.port}`);
  console.log(`[BFF] Helios base URL: ${config.helios.baseUrl}`);
});

module.exports = app;
