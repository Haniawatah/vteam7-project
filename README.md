# Svenska Elsparkcyklar

## Quick Start (Docker)

Start **backend**, **frontend**, **database**, and **simulator** with one command:

```bash
docker compose up --build
```

| Service    | URL / Info                                 |
|------------|--------------------------------------------|
| Frontend   | http://localhost:5173                      |
| Backend    | http://localhost:3000/v1/health            |
| Mongo      | localhost:27017                            |
| Simulator  | Runs automatically after backend is healthy |

The simulator creates 1000 users + 1000 scooters and keeps ~250 rides active.

To stop everything:
```bash
docker compose down
```

## Troubleshooting

If scooters don't appear:
1. Check backend health: `curl http://localhost:3000/v1/health`
2. Check scooters endpoint: `curl http://localhost:3000/v1/scooters`
3. Check simulator logs: `docker compose logs simulator`

