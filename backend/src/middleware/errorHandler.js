/**
 * Centralised error handler.
 *
 * Normalises errors from Helios upstream, the auth layer, and validation into
 * a consistent JSON envelope: { error: { status, message, upstream? } }.
 * Never leaks stack traces or access tokens to the client.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.response?.status || 500;
  const message = err.message || 'Internal server error';

  // Forward structured Helios error details when available
  const heliosBody = err.response?.data;

  console.error(`[ERROR] ${req.method} ${req.path} → ${status}: ${message}`);

  res.status(status).json({
    error: {
      status,
      message,
      ...(heliosBody && { upstream: heliosBody }),
    },
  });
}

module.exports = { errorHandler };
