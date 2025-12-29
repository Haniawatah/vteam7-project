# vteam7-project
This is vteams 7 project for “Svenska Elsparkcyklar AB”.

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
