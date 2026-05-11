# Helios Manager

An internal tool for inspecting and auditing the **Guidewire Helios Settings Vault** via its REST API.

## Architecture

```
Browser (React)
     │   reads only /bff/*
     ▼
Express BFF  (Node.js)          ← OAuth token lives here only
     │   calls Helios with Bearer token
     ▼
Helios Settings Vault API  (api.guidewire.com/api/v1/…)
```

- **No browser → Helios direct calls** — the BFF owns the OAuth lifecycle.
- **Read-only by default** — all BFF endpoints are `GET`.
- **Secrets masked** — `isSecret` setting values are never forwarded to the frontend.
- **Audit log** — every BFF response is logged (stdout stub; replace `persist()` in `backend/src/middleware/audit.js`).

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

### 1 — Configure the BFF

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:

```
HELIOS_CLIENT_ID=<your Okta client ID>
HELIOS_CLIENT_SECRET=<your Okta client secret>
HELIOS_BASE_URL=https://api.guidewire.com
HELIOS_TOKEN_URL=https://guidewire-hub.okta.com/oauth2/default/v1/token
HELIOS_SCOPES=groups tenant_id
```

### 2 — Start the BFF

```bash
cd backend
npm install
npm run dev        # nodemon hot-reload
# or: npm start   # production
```

BFF will start on **http://localhost:3001**. Test it:

```bash
curl http://localhost:3001/health
# → {"status":"ok","service":"helios-manager-bff"}
```

### 3 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

The Vite dev server proxies `/bff/*` → `http://localhost:3001/bff/*` automatically.

---

## BFF Endpoint Reference

| BFF Endpoint | Helios operationId | Description |
|---|---|---|
| `GET /bff/whoami` | `getCurrentUserInfo` | Current user info |
| `GET /bff/tenants` | `getAllTenants` | List / search tenants |
| `GET /bff/tenants/:id` | `getTenant` | Tenant detail |
| `GET /bff/applications` | `getAllApplications` | List / search applications |
| `GET /bff/applications/:id` | `getApplication` | Application detail |
| `GET /bff/applications/:id/roles` | `getApplicationRoles` | Application roles |
| `GET /bff/applications/:id/deployments` | `getAllDeployments` | List deployments |
| `GET /bff/applications/:id/deployments/:depId` | `getDeployment` | Deployment detail |
| `GET /bff/applications/:id/setting-definitions` | `getAllApplicationSettingDefinitions` | List setting definitions |
| `GET /bff/applications/:id/setting-definitions/:sdId` | `getApplicationSettingDefinition` | Setting definition detail |
| `GET /bff/setting-values` | `getAllSettingValues` | List / search setting values |
| `GET /bff/setting-values/:id` | `getSettingValue` | Setting value detail |
| `GET /bff/setting-values/:id/history` | `executeHistoryQuery` | Setting value history |

All BFF endpoints accept an optional `tenantId` query parameter which is forwarded as the `GW-Tenant` header to Helios.

---

## Project Structure

```
helios-manager/
├── helios-openapi-schema.json   # Guidewire Helios OpenAPI spec (source of truth)
├── README.md
│
├── backend/                     # Node.js + Express BFF
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js             # App entry
│       ├── config.js            # Env-var config
│       ├── clients/
│       │   └── heliosClient.js  # Axios wrapper (auth header, error normalisation)
│       ├── middleware/
│       │   ├── auth.js          # OAuth2 client-credentials + token cache
│       │   ├── audit.js         # Audit logging hook
│       │   └── errorHandler.js  # Centralised error handler
│       ├── controllers/         # Business logic per resource
│       │   ├── whoamiController.js
│       │   ├── tenantController.js
│       │   ├── applicationController.js
│       │   ├── settingDefinitionController.js
│       │   └── settingValueController.js
│       ├── dto/
│       │   └── index.js         # DTO mappers (masks secrets, stable field set)
│       └── routes/
│           └── index.js         # Express router
│
└── frontend/                    # React + Vite + Tailwind CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js           # Dev proxy /bff → localhost:3001
    ├── tailwind.config.js
    └── src/
        ├── index.jsx
        ├── App.jsx              # React Router setup
        ├── index.css            # Tailwind + component tokens
        ├── services/
        │   └── api.js           # All BFF calls; API mapping comments included
        ├── components/
        │   ├── Layout.jsx       # Sidebar + top-bar
        │   ├── LoadingSpinner.jsx
        │   ├── ErrorAlert.jsx
        │   ├── Badge.jsx
        │   └── StatCard.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Tenants.jsx
            ├── TenantDetail.jsx
            ├── Applications.jsx
            ├── ApplicationDetail.jsx  # Details + Deployments + Setting Defs tabs
            └── SettingValues.jsx      # Search + side-panel detail + history
```

---

## Security notes

- `HELIOS_CLIENT_SECRET` must never be committed. It lives in `.env` (git-ignored).
- Access tokens are cached in-process and refreshed 60 s before expiry.
- Secret setting values (`isSecret: true`) are replaced with `***REDACTED***` in the DTO layer before any data reaches the frontend.
- The CORS `origin` is locked to `FRONTEND_URL` (default `http://localhost:3000`).

---

## Extending

| Task | Where to change |
|---|---|
| Persist audit entries to a DB | `backend/src/middleware/audit.js` → `persist()` |
| Add pagination UI | `frontend/src/pages/*.jsx` — use `nextPageToken` from BFF responses |
| Add write operations | Add `POST/PUT` routes in `backend/src/routes/index.js` + controllers |
| Use Helios v2 setting-values API | Add controllers targeting `/setting-values/v2/…` endpoints |
