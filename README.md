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

Svenska Elsparkcyklar - Management System
A comprehensive full-stack solution developed for "Svenska Elsparkcyklar AB" to manage and track a large-scale e-scooter fleet. This project demonstrates high-level software engineering principles, from microservices architecture to real-time simulation.

🏗️ Development & Architecture
This project was built with a focus on scalability and developer experience. As the Lead Developer, I spearheaded the following areas:

System Design: Architected the core communication between the backend API and the interactive frontend.

DevOps & Containerization: Built the entire Docker infrastructure to allow one-command deployment (docker compose up).

Data & Simulation: Developed a custom simulation engine to stress-test the system with thousands of active rides and GPS pings.

Backend Logic: Implemented the primary RESTful routes, authentication, and database management. 

🛠️ Tech Stack
Frontend: React (Vite), TypeScript/JavaScript.

Backend: Node.js, Express.

Database: MongoDB / NoSQL.

Infrastructure: Docker, GitHub Actions (CI/CD), SonarQube.
