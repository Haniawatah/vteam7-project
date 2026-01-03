# vteam7-project

Backend (Express) + Frontend (React/Vite).

## What changed (recent)

### Frontend
- Admin dashboard: added a tabbed view with **Scooters / Users / Stations / Logs**.
- Map: scooters are polled regularly, markers update without resetting the map view, and the UI shows small loading/error badges instead of crashing.
- Profile: replaced the empty placeholder with a real profile page (account info, wallet/balance, ride summary + quick links).
- UI: added CSS for the admin dashboard layout and profile page so they look consistent.

### Backend
- Basic API wiring to support the UI endpoints listed below (plus fixes to avoid startup import/export errors).
- Added/updated middleware helpers and route modules used by the admin UI.

## Run (dev)

### Backend
```bash
cd backend
npm install
npm start
```
Health: http://localhost:3000/v1/health

### Frontend
```bash
cd frontend/svenska-elsparkcyklar-frontend
npm install
npm run dev
```
Open the exact Vite URL it prints.

## Frontend ↔ Backend

The frontend proxies `/v1` to `http://localhost:3000`.

Quick check (use your Vite port):
- `http://localhost:5174/v1/health` → `{"ok":true}`

## API used by the UI (v1)

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- Scooters: `GET /scooters`
- Rides: `POST /rides`, `GET /rides/active/:rideId`, `GET /rides/history`, `PUT /rides/end/:rideId`
- Profile payment: `GET /users/me/payment`, `PUT /users/me/payment`
- Admin: `GET /users`, `GET /stations`, `GET /reports`, `GET /rides/history` (alias: `/logs`)

## Admin

The UI only shows `/admin` if `localStorage.user.role === "admin"`.

If your backend supports env-based admin bootstrapping, set:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

## Common mix-ups

- `localhost:3000` is backend, not the React UI
- Vite might run on `5173`, `5174`, etc. — use the printed URL
