# vteam7-project

Monorepo: **backend** (Express + MongoDB) and **frontend** (React + Vite).

## Quick start

### Backend (port 3000)
```bash
cd backend
npm install
npm start
```

Health:
- http://localhost:3000/v1/health

### Frontend (Vite port 5173/5174/…)
```bash
cd frontend/svenska-elsparkcyklar-frontend
npm install
npm run dev
```

The frontend proxies `/v1` to `http://localhost:3000`.

## API used by the frontend
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/users` (admin)
- `GET/PUT /v1/users/me/payment`
- `GET /v1/scooters`
- `POST /v1/rides`
- `GET /v1/rides/active/:rideId`
- `GET /v1/rides/history`
- `PUT /v1/rides/end/:rideId`
- `GET /v1/reports` (admin)

## Backend changes (added)
- Added a MongoDB-based backend using `mongodb` + `express`.
- Implemented basic auth (register/login/logout) with token sessions.
- Implemented core REST endpoints used by the frontend:
  - `/v1/scooters` (list/create/update/delete)
  - `/v1/rides` (create ride, active ride, ride history, end ride)
  - `/v1/users/me/payment` (get/update payment info)
  - `/v1/reports` (admin reports)
- Added `/v1/health` for integration testing.

## Run (dev)

### Backend
```bash
cd backend
npm install
npm start
```

Backend: http://localhost:3000  
Health check: http://localhost:3000/v1/health

## Login / Auth

Base URL (backend): `http://localhost:3000`

### User registration + login
**Register**
- `POST /v1/auth/register`
- body: `{ "email": "...", "password": "...", "name": "..." }`

**Login**
- `POST /v1/auth/login`
- body: `{ "email": "...", "password": "..." }`

Response (both): `{ token: string, user: { id, email, name, role, ... } }`

Example:
```bash
curl -s -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","name":"User"}'
```

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

Use the token for protected routes:
- header: `Authorization: Bearer <token>`

---

### Admin login
**Admin login endpoint**
- `POST /v1/auth/admin/login`
- body: `{ "email": "...", "password": "..." }`
- Will fail unless the account has `role: "admin"`.

**How the admin account is created**
On backend startup, the server runs `ensureAdminFromEnv()` which creates/updates an admin user from env vars:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Minimal `.env` (in `backend/.env` or exported in your shell):
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

Admin login example:
```bash
curl -s -X POST http://localhost:3000/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"change-me"}'
```

If login succeeds, `user.role` should be `"admin"`.
