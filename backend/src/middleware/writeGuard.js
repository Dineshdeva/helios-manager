/**
 * Write guard middleware.
 *
 * Blocks all mutating requests (POST, PUT, PATCH, DELETE) unless the server
 * was started with ENABLE_WRITE_OPS=true. This keeps the tool read-only by
 * default; an operator must consciously opt in before any data changes are
 * possible.
 */
const config = require('../config');

function writeGuard(req, res, next) {
  if (!config.enableWriteOps) {
    return res.status(403).json({
      error: {
        status: 403,
        message:
          'Write operations are disabled. Set ENABLE_WRITE_OPS=true in the BFF environment to enable them.',
      },
    });
  }
  next();
}

module.exports = { writeGuard };
