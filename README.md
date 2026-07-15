# User Registration System

A full-stack user management app: a Symfony REST API backed by MongoDB, and a React + TypeScript admin UI for listing, creating, editing, and deleting users.

## Tech Stack

**Backend**
- Symfony 8.1, PHP 8.4 (runs in Docker — see [Why Docker for the backend](#why-docker-for-the-backend))
- MongoDB via Doctrine MongoDB ODM (`doctrine/mongodb-odm-bundle`)
- `symfony/validator` for request validation, `nelmio/cors-bundle` for CORS

**Frontend**
- React 19 + TypeScript, built with Vite
- [ag-grid-community](https://www.ag-grid.com/) for the data table
- `axios` for API calls

**Architecture**: Controllers are thin and delegate to a Service layer (business logic, validation orchestration), which uses a Repository layer (Doctrine ODM) for data access. See `backend/src/{Controller,Service,Repository,Document,Dto,Exception,EventSubscriber}`.

## Prerequisites

- [Docker](https://www.docker.com/) (for the backend + MongoDB)
- [Node.js](https://nodejs.org/) 18+ (for the frontend)

You do **not** need PHP or Composer installed on your host — the backend and its dependencies are built and run entirely inside Docker.

## Setup Instructions

### 1. Start MongoDB

The backend expects a MongoDB instance reachable on the Docker network `scout_net`, in a container named `scout_mongo`:

```bash
docker network create scout_net
docker run -d --name scout_mongo --network scout_net -p 27017:27017 -v scout_mongo_data:/data/db mongo:7
```

(If you already have `scout_mongo` running on the default bridge network, just attach it: `docker network connect scout_net scout_mongo`.)

### 2. Start the backend

```bash
cd backend
docker compose up -d --build
```

This builds a `php:8.4-cli` image with the `mongodb` extension and Composer, installs dependencies, and creates the MongoDB collections/indexes. On first run, initialize the schema (unique index on `email`, etc.):

```bash
docker compose exec backend php bin/console doctrine:mongodb:schema:create
```

The API is now live at `http://127.0.0.1:8000/api`. Sanity check:

```bash
curl http://127.0.0.1:8000/api/users
```

Useful commands:

```bash
docker compose logs -f backend           # tail logs
docker compose exec backend php bin/console debug:router   # list routes
docker compose down                      # stop the backend
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies API calls to `http://127.0.0.1:8000/api` (configurable via `frontend/.env`, key `VITE_API_URL`).

## Configuration

Backend environment variables (`backend/.env`, overridden in `backend/compose.yaml` for the containerized run):

| Variable | Purpose | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://scout_mongo:27017` (container) |
| `MONGODB_DB` | Database name | `user_registration` |
| `CORS_ALLOW_ORIGIN` | Regex of allowed origins | `localhost`/`127.0.0.1`, any port |

Frontend environment variables (`frontend/.env`):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://127.0.0.1:8000/api` |

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users?page=&limit=` | List users, paginated |
| `GET` | `/api/users/{id}` | Get a single user |
| `POST` | `/api/users` | Create a user |
| `PUT` | `/api/users/{id}` | Update a user (partial fields accepted) |
| `DELETE` | `/api/users/{id}` | Delete a user |

User fields: `firstName`, `lastName`, `email` (unique), `role` (`admin` \| `manager` \| `user`), `status` (`active` \| `inactive` \| `pending`), plus auto-managed `id`, `createdAt`, `updatedAt`.

Error responses use `{ "message": string, "errors"?: Record<string, string> }` with status `422` (validation), `404` (not found), or `409` (duplicate email).

## Why Docker for the Backend

Symfony 8 requires PHP ≥ 8.4. Rather than upgrading the host machine's PHP (which, depending on your OS/package manager, can mean rebuilding many shared libraries), the backend runs in a `php:8.4-cli` container defined in `backend/Dockerfile` and `backend/compose.yaml`. This keeps the host environment untouched and the backend reproducible across machines.
