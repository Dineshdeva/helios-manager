/**
 * Parameter sanitization helpers.
 *
 * All route params that are interpolated into upstream Helios URLs must be
 * validated here to prevent Server-Side Request Forgery (SSRF) / path traversal.
 *
 * Helios IDs are UUIDs or alphanumeric slugs; deployment IDs can contain
 * colons and dots (e.g. "gwcp:platform:product:insurer:env:planet"). We allow
 * a deliberately conservative set of characters and reject anything else.
 */

/**
 * Safe character set for standard Helios entity IDs (UUIDs / slug style).
 * Allows: letters, digits, hyphens, underscores.
 */
const SAFE_ID_RE = /^[A-Za-z0-9\-_]+$/;

/**
 * Slightly broader set for Helios deployment IDs which use colon-separated
 * notation and dots for version segments.
 * Allows: letters, digits, hyphens, underscores, dots, colons.
 */
const SAFE_DEPLOYMENT_ID_RE = /^[A-Za-z0-9\-_./:]+$/;

const MAX_PARAM_LENGTH = 256;

/**
 * Validates a standard Helios entity ID (UUID / slug).
 * Returns the sanitized string, or throws an Error with status 400 if invalid.
 *
 * @param {string} value
 * @param {string} name  Human-readable param name for error messages
 * @returns {string}
 */
function validateId(value, name = 'id') {
  if (typeof value !== 'string' || value.length === 0) {
    throw Object.assign(new Error(`Invalid ${name}: must be a non-empty string`), { status: 400 });
  }
  if (value.length > MAX_PARAM_LENGTH) {
    throw Object.assign(new Error(`Invalid ${name}: exceeds maximum length`), { status: 400 });
  }
  if (!SAFE_ID_RE.test(value)) {
    throw Object.assign(
      new Error(`Invalid ${name}: contains disallowed characters`),
      { status: 400 }
    );
  }
  return value;
}

/**
 * Validates a Helios deployment ID (colon/dot-separated notation).
 * Returns the sanitized string, or throws an Error with status 400 if invalid.
 *
 * @param {string} value
 * @param {string} name
 * @returns {string}
 */
function validateDeploymentId(value, name = 'deploymentId') {
  if (typeof value !== 'string' || value.length === 0) {
    throw Object.assign(new Error(`Invalid ${name}: must be a non-empty string`), { status: 400 });
  }
  if (value.length > MAX_PARAM_LENGTH) {
    throw Object.assign(new Error(`Invalid ${name}: exceeds maximum length`), { status: 400 });
  }
  if (!SAFE_DEPLOYMENT_ID_RE.test(value)) {
    throw Object.assign(
      new Error(`Invalid ${name}: contains disallowed characters`),
      { status: 400 }
    );
  }
  return value;
}

module.exports = { validateId, validateDeploymentId };
