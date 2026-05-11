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

## Deployment

### Recommended: Frontend → Vercel, Backend → Render / Railway

This project is a monorepo with two separate deployable units:
- **Frontend** — Vite/React static site (Vercel)
- **Backend (BFF)** — Express.js long-running server (Render, Railway, Fly.io)

> Vercel's serverless model is not compatible with `express-session` MemoryStore (sessions are lost between invocations). Deploying the backend to a persistent Node.js host avoids this limitation entirely.

---

#### 1 — Deploy the Backend (Render / Railway)

1. Create a new **Web Service** on [Render](https://render.com) (or equivalent) pointing at the `backend/` directory.
2. Set **Build Command**: `npm install`  
   Set **Start Command**: `npm start`
3. Set all required environment variables in the platform dashboard:

| Variable | Value |
|---|---|
| `HELIOS_BASE_URL` | `https://api.guidewire.com` |
| `HELIOS_CLIENT_ID` | Your Okta client ID |
| `HELIOS_CLIENT_SECRET` | Your Okta client secret (if using client-credentials) |
| `HELIOS_TOKEN_URL` | Okta token endpoint |
| `HELIOS_REDIRECT_URI` | `https://your-backend.onrender.com/bff/auth/callback` |
| `HELIOS_SCOPES` | `groups tenant_id` |
| `SESSION_SECRET` | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `COOKIE_SECURE` | `true` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (set after deploying frontend) |
| `ENABLE_WRITE_OPS` | `false` (or `true` to allow mutations) |

4. Note the deployed backend URL (e.g. `https://helios-manager-bff.onrender.com`).

---

#### 2 — Register the production redirect URI in Okta

In your Okta app settings, add the production callback URL as an allowed redirect URI:

```
https://your-backend.onrender.com/bff/auth/callback
```

---

#### 3 — Deploy the Frontend (Vercel)

1. Import the repository on [Vercel](https://vercel.com) and set the **Root Directory** to `frontend/`.
2. Vercel will automatically detect the `frontend/vercel.json` settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - SPA rewrite rule (so React Router deep links work)
3. Add the following **Environment Variable** in the Vercel project settings:

| Variable | Value |
|---|---|
| `VITE_BFF_URL` | `https://your-backend.onrender.com/bff` |

4. Deploy. The frontend will call the backend using the `VITE_BFF_URL` value at build time.

---

#### 4 — Wire up CORS

Once both services are deployed, go back to the backend platform and update `FRONTEND_URL` to your Vercel URL (e.g. `https://helios-manager.vercel.app`). The BFF CORS policy uses this value to allow cross-origin requests from the frontend.

---



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
