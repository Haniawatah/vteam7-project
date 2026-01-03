# vteam7-project

Project for “Svenska Elsparkcyklar AB”.

## What’s in the UI

### Admin dashboard (`/admin`)
- **Scooters**: list with id/city/status/battery/coords (refresh + local “change status” simulation).
- **Users**: list users + role editor + delete (requires backend endpoints).
- **Stations**: list charging/parking stations (falls back to cities if needed).
- **Logs**: ride history/log rows (history endpoint with a logs fallback).

### Profile (`/profile`)
- Account info (name/email/id/role)
- Wallet/balance
- Ride summary + recent rides
- Quick links to payment/settings/history

## Prerequisites
- Node.js + npm installed
- Recommended: run from **VS Code** with **two terminals**
- If you run the project inside **WSL**, read the **WSL note** below.

---

## Run (dev): Backend + Frontend at the same time

### 1) Terminal A — start the backend (port **3000**)
```bash
cd backend
npm install
npm start
```

Backend base URL:
- `http://localhost:3000`

Health check:
- `http://localhost:3000/v1/health`

---

### 2) Terminal B — start the frontend (port **5173/5174/...**)
```bash
cd frontend/svenska-elsparkcyklar-frontend
npm install
npm run dev
```

Frontend URL:
- Open the **exact URL Vite prints** in the terminal (example: `http://localhost:5174/`).

---

## Verify the ports / integration

### A) Backend alone
Open:
- `http://localhost:3000/v1/health`  
Expected:
- `{"ok":true}`

### B) Frontend alone
Open:
- the URL Vite prints (example `http://localhost:5174/`)

### C) Frontend → Backend (proxy/integration)
Open using the **frontend port**:
- `http://localhost:5174/v1/health`  
Expected:
- `{"ok":true}`

If (C) works, the frontend is successfully talking to the backend through Vite (frontend `/v1` → backend `http://localhost:3000`).

---

## Common mistakes
- Opening `http://localhost:3000/` expecting the React UI (port 3000 is **backend**)
- Opening `http://localhost:5173/v1/health` but Vite actually started on `5174` (always use the printed URL)

---

## WSL note (Windows browser can’t reach Vite)
If Vite runs inside WSL and `http://localhost:517x/` doesn’t load in Windows, bind Vite to all interfaces:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the **Network** URL Vite prints, or find your WSL IP:
```bash
ip addr show eth0
```
and open:
- `http://<WSL_IP>:5174/`

---

# Svenska Elsparkcyklar AB (Frontend)

React + Vite.

## Run

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

## Check integration

Open (use your Vite port):
- http://localhost:5174/v1/health

## WSL

If the Windows browser can’t open Vite:
```bash
npm run dev -- --host 0.0.0.0
```