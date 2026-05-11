/**
 * Audit logging middleware.
 *
 * Logs every BFF request with method, path, query, caller identity,
 * HTTP status, and response duration. Extend the `persist` function to
 * write audit entries to a database, S3, or SIEM pipeline.
 */

/**
 * Persist an audit entry. Stubbed to stdout; replace with your storage backend.
 * @param {object} entry
 */
function persist(entry) {
  // TODO: replace with database / SIEM write
  console.log('[AUDIT]', JSON.stringify(entry));
}

/**
 * Express middleware: instruments outgoing JSON responses with audit entries.
 */
function auditLog(req, res, next) {
  const startedAt = Date.now();

  // Wrap res.json so we capture the status code after it is set
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const result = originalJson(body);

    persist({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      // Caller identity comes from an upstream gateway header or the JWT subject
      user: req.headers['x-user-id'] || req.headers['x-forwarded-user'] || 'anonymous',
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });

    return result;
  };

  next();
}

module.exports = { auditLog };
