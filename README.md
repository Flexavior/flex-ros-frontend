# MSS-CRM — Frontend

Single-page application (SPA) for MSS-CRM: React 19 + Vite + React Router. Talks to the Laravel API at `/api/v1` using Sanctum bearer tokens stored in `localStorage`.

See also: [project root README](../README.md) · [backend README](../backend/README.md)

---

## Overview

### What this app does

| Page / area | Purpose |
|-------------|---------|
| **Login** | Email/password → API token |
| **Dashboard** | KPIs, funnel, stale tasks |
| **Leads / Lead detail** | Pipeline, engagements, convert, **Microsoft 365 email** |
| **Customers / Customer detail** | Client ID, checklists, agreements, **Microsoft 365 email** |
| **Products & Services** | Catalogue |
| **Marketing** | Campaigns, posts, channels |
| **Inbox** | Omnichannel threads (Facebook, Viber, LINE, Outlook) + Reverb live refresh |
| **System Settings** | Admin checklists, general settings; Microsoft OAuth return landing |

### How it works

```
Browser (localhost:5173 dev)
    │
    ├── Vite dev server
    │     proxy /api/*          ──►  Laravel :8000/api/v1/*
    │     proxy /broadcasting/* ──►  Laravel :8000/broadcasting/*
    │
    ├── axios (src/api/client.js)
    │     Authorization: Bearer <token from localStorage mss_token>
    │
    └── Laravel Echo (src/api/echo.js) — optional
          private-inbox channel ──► Reverb :8080 (when VITE_REVERB_* set)
```

### Key directories

```
src/
├── api/client.js          Axios instance + 401 → logout
├── api/echo.js            Reverb / Echo for inbox realtime
├── context/AuthContext.jsx Session, login/logout
├── components/
│   ├── Layout.jsx         Sidebar navigation
│   └── MicrosoftEmailPanel.jsx
├── pages/                 One file per major route
├── styles.css             Global + inbox styles
App.jsx                    Routes + role guards
vite.config.js             Dev proxy to backend
```

### Role-gated routes

- **Inbox** — `customer_service`, sales, staff, senior_staff, supervisor, senior_management, ceo, admin
- **Settings** — `admin` only

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | 18+ (20 LTS recommended) |
| **npm** | 9+ |
| **Backend API** | Running at `http://127.0.0.1:8000` (or adjust Vite proxy) |

Optional for **live inbox updates**:

- Backend Reverb running (`php artisan reverb:start`)
- `frontend/.env.local` with `VITE_REVERB_*` matching backend `REVERB_*`

Optional for **Microsoft 365 send**:

- Backend `AZURE_*` configured; user connects via email panel or Settings OAuth return

---

## Initial setup (local development)

### 1. Install dependencies

```powershell
cd C:\laragon\www\mss-crm\frontend
npm install
```

### 2. Environment (optional but recommended)

```powershell
copy .env.example .env.local
```

Example `.env.local` for inbox realtime:

```env
VITE_REVERB_APP_KEY=local-reverb-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Values must match [backend `.env`](../backend/.env.example) `REVERB_*`. If omitted, Inbox still works but requires manual refresh or sync.

### 3. Start backend first

From [backend README](../backend/README.md):

```powershell
cd ..\backend
php artisan serve
```

### 4. Start frontend dev server

```powershell
cd C:\laragon\www\mss-crm\frontend
npm run dev
```

Open **http://localhost:5173**

- Login e.g. `sales@mss.test` / `password`
- API calls go to `/api/v1/...` (proxied to port 8000)

### 5. Production-like preview (local)

Build static assets and preview:

```powershell
npm run build
npm run preview
```

For production, deploy the `dist/` folder behind Nginx/CDN and ensure `/api` and `/broadcasting` route to Laravel (see deployment below).

---

## Deployment guide (production)

### Option A — SPA + separate API (common)

1. **Build**

   ```bash
   npm ci
   npm run build
   ```

   Output: `frontend/dist/` (static HTML, JS, CSS).

2. **Host** `dist/` on Nginx, S3+CloudFront, or Laragon/IIS static site.

3. **Reverse proxy** on the same domain (avoids CORS):

   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:8000/api/;
   }
   location /broadcasting/ {
       proxy_pass http://127.0.0.1:8000/broadcasting/;
   }
   location / {
       root /var/www/mss-crm/frontend/dist;
       try_files $uri $uri/ /index.html;
   }
   ```

4. **Environment at build time** — Vite embeds `VITE_*` vars when you run `npm run build`. Set CI secrets:

   ```bash
   VITE_REVERB_APP_KEY=prod-key
   VITE_REVERB_HOST=crm.yourdomain.com
   VITE_REVERB_PORT=443
   VITE_REVERB_SCHEME=https
   npm run build
   ```

   Reverb in production often sits behind TLS on 443 (configure `REVERB_*` on backend accordingly).

### Option B — API-only dev pattern

Developers run Vite locally with proxy (default `vite.config.js`); production users hit deployed SPA as in Option A.

### Auth notes

- Token key: `localStorage` item `mss_token`
- 401 on API (except login) clears token and redirects to `/login`
- OAuth Microsoft return: backend redirects browser to `/settings?microsoft=connected` (requires `FRONTEND_URL` on backend)

### CORS

If SPA and API are on **different origins** without a proxy, configure Laravel CORS for the SPA origin and use full API URL in `client.js` — the default setup assumes **same-origin proxy** in dev and **nginx proxy** in prod.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server on port **5173** with API proxy |
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Serve `dist/` locally for smoke testing |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 401 / instant logout | Log in again; ensure backend running on :8000 |
| API network error | Check Vite proxy targets in `vite.config.js` |
| Blank page after deploy | Configure server `try_files` → `index.html` for client routes |
| Inbox never auto-updates | Set `VITE_REVERB_*`, run backend Reverb, check browser console for Echo |
| Microsoft connect loop | Backend `FRONTEND_URL` and Azure redirect URI must match |
| CORS errors in prod | Use reverse proxy or enable CORS for SPA origin on Laravel |

---

## Route map

| Path | Component |
|------|-----------|
| `/login` | Login |
| `/` | Dashboard |
| `/leads`, `/leads/:id` | Leads, LeadDetail |
| `/customers`, `/customers/:id` | Customers, CustomerDetail |
| `/products` | Products |
| `/marketing` | Marketing |
| `/inbox` | Inbox (role-gated) |
| `/settings` | Settings (admin) |

Defined in [`src/App.jsx`](src/App.jsx).
