require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  helios: {
    baseUrl: process.env.HELIOS_BASE_URL || 'https://api.guidewire.com',
    tokenUrl:
      process.env.HELIOS_TOKEN_URL ||
      'https://guidewire-hub.okta.com/oauth2/default/v1/token',
    clientId: process.env.HELIOS_CLIENT_ID,
    clientSecret: process.env.HELIOS_CLIENT_SECRET,
    scopes: process.env.HELIOS_SCOPES || 'groups tenant_id',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};
