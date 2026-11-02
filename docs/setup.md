# Setup

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16 (local install or Docker)

## Repository layout

```
collaborative-docs/
├── frontend/     # Next.js app (port 3000)
├── backend/      # Express + Prisma API (port 4000)
├── docs/         # Project documentation
└── docker-compose.yml
```

## Install

From the repo root:

```bash
npm install
```

## Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

See [README.md](../README.md) for variable details (`DATABASE_URL`, `PORT`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`).

## Database

### Docker Compose (optional)

```bash
npm run db:up
npm run db:down
```

### Local PostgreSQL

Use a running Postgres 16 instance and a database matching `DATABASE_URL` (default database name `collaborative_docs`).

### Migrate and seed

```bash
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run seed -w backend
```

## Development

```bash
npm run dev
# or
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
```

Backend health: `GET http://localhost:4000/health` → `{ "status": "ok" }`.

## Ports

| Port | Service |
|------|---------|
| 3000 | Next.js frontend |
| 4000 | Express backend |
| 5432 | PostgreSQL |
