require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  // Secret used to sign express-session cookies. MUST be set in production.
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  helios: {
    baseUrl: process.env.HELIOS_BASE_URL || 'https://api.guidewire.com',
    // Authorization Code flow URLs (from Helios OpenAPI securitySchemes)
    authorizationUrl:
      process.env.HELIOS_AUTHORIZATION_URL ||
      'https://guidewire-hub.okta.com/oauth2/aus11vix3uKEpIfSI357/v1/authorize',
    tokenUrl:
      process.env.HELIOS_TOKEN_URL ||
      'https://guidewire-hub.okta.com/oauth2/aus11vix3uKEpIfSI357/v1/token',
    // Your Okta application's client_id (same one shown in the Helios Swagger UI)
    clientId: process.env.HELIOS_CLIENT_ID,
    // client_secret is OPTIONAL — only needed for client_credentials fallback.
    // Leave blank when using the Authorization Code + PKCE interactive login.
    clientSecret: process.env.HELIOS_CLIENT_SECRET,
    scopes: process.env.HELIOS_SCOPES || 'groups tenant_id',
    // Where Okta should redirect after the user authenticates.
    // Must exactly match a redirect URI registered in your Okta app.
    redirectUri:
      process.env.HELIOS_REDIRECT_URI || 'http://localhost:3001/bff/auth/callback',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  // Write operations are opt-in. Set ENABLE_WRITE_OPS=true to allow POST/PUT.
  enableWriteOps: process.env.ENABLE_WRITE_OPS === 'true',
};
