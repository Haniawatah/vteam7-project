# vteam7-project

Project for “Svenska Elsparkcyklar AB”.

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

React + Vite frontend for “Svenska Elsparkcyklar AB”.

## Prerequisites
- Node.js + npm
- Backend running on `http://localhost:3000`

---

## Start the frontend (dev)
From this folder:

```bash
npm install
npm run dev
```

Open the **exact URL Vite prints** (example: `http://localhost:5174/`).

> Note: Vite may use `5173`, `5174`, etc. depending on what is free.

---

## Start backend + frontend together (two terminals)

### Terminal A (backend)
```bash
cd backend
npm install
npm start
```
Backend health:
- `http://localhost:3000/v1/health`

### Terminal B (frontend)
```bash
cd frontend/svenska-elsparkcyklar-frontend
npm install
npm run dev
```
Frontend:
- open the printed Vite URL (example `http://localhost:5174/`)

---

## Verify integration (frontend talking to backend)
Open (use your frontend port):
- `http://localhost:5174/v1/health`

Expected:
- `{"ok":true}`

---

## Troubleshooting

### `HTTP ERROR 404` on the frontend URL
Usually means:
- you opened the wrong port, or
- you started Vite in the wrong directory, or
- `index.html` is missing from the frontend root.

### Running in WSL
If Windows can’t open the Vite URL, start with:
```bash
npm run dev -- --host 0.0.0.0
```
Then open the **Network** URL Vite prints.