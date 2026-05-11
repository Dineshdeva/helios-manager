/**
 * Centralized error handler.
 *
 * Normalizes errors from Helios upstream, the auth layer, and validation into
 * a consistent JSON envelope: { error: { status, message, upstream? } }.
 * Never leaks stack traces or access tokens to the client.
 */

/**
 * Express error-handling middleware.
 *
 * NOTE: Express identifies error-handling middleware by the arity of the function
 * (it must declare exactly 4 parameters: err, req, res, next). The `next`
 * parameter is required by the framework signature even though it is not called
 * in this implementation; omitting it would cause Express to treat this as a
 * regular middleware and errors would not be routed here.
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
