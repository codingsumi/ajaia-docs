# Collaborative Docs

Lightweight collaborative document editor built for the Ajaia AI-Native Full Stack Developer assessment.

Users can sign in, create and edit rich-text documents with Tiptap, share documents with VIEW or EDIT access, and import `.txt` / `.md` files. Realtime multi-cursor collaboration is intentionally out of scope.

## Features

- Email/password login with JWT authentication (no public registration)
- Dashboard: owned documents, shared documents, create, import, logout
- Tiptap editor: bold, italic, underline, headings, bullet/numbered lists
- Autosave title and JSON content with Saving / Saved / Error status
- Document sharing by email (VIEW / EDIT); owner-managed access list
- Permission enforcement on the backend (VIEW cannot edit; only owner deletes/shares)
- File import for `.txt` and `.md` into Tiptap JSON
- Seeded demo users for local evaluation

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Tiptap |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (HMAC-SHA256 via Node `crypto`), passwords via `scrypt` |
| Monorepo | npm workspaces (`frontend`, `backend`) |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16 (local install **or** Docker via `docker-compose.yml`)

## Environment setup

From the repository root:

```bash
npm install
```

### Backend env

```bash
cp backend/.env.example backend/.env
```

`backend/.env.example`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/collaborative_docs?schema=public"
PORT=4000
JWT_SECRET="change-me-to-a-long-random-string"
```

Set a strong `JWT_SECRET` before any shared/deployed use.

### Frontend env

```bash
cp frontend/.env.example frontend/.env.local
```

`frontend/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## PostgreSQL setup

### Option A — Docker Compose

```bash
npm run db:up
```

This starts Postgres 16 with user/password/db matching `backend/.env.example`.

Stop with:

```bash
npm run db:down
```

### Option B — Local PostgreSQL 16

Ensure PostgreSQL is running on port `5432`, then create a database owned by `postgres` (example):

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres createdb -O postgres collaborative_docs
```

Adjust `DATABASE_URL` if your local credentials differ.

## Database migration and seed

```bash
# Generate Prisma Client
npm run prisma:generate -w backend

# Apply migrations (creates tables from Prisma schema)
npm run prisma:migrate -w backend

# Seed demo users
npm run seed -w backend
```

If migrations already exist and you only need to apply them on a fresh database, `prisma migrate dev` (via the script above) remains the project’s documented path.

## Run frontend and backend

Together (from repo root):

```bash
npm run dev
```

Individually:

```bash
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 |
| Health | http://localhost:4000/health |

## Demo credentials

| Email | Password |
|-------|----------|
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

Created/updated by `npm run seed -w backend`.

## Testing and production build

```bash
# Backend API test (Node test runner)
npm run test -w backend

# Frontend production build
npm run build -w frontend

# Backend TypeScript build
npm run build -w backend

# Both packages (root)
npm run build
```

Production start (after build):

```bash
npm run start -w backend    # serves compiled Express app
npm run start -w frontend   # next start
```

## Project layout

```
collaborative-docs/
├── frontend/          # Next.js UI
├── backend/           # Express + Prisma API
├── docs/              # Architecture, setup, AI workflow
├── docker-compose.yml # Optional Postgres
├── README.md
└── SUBMISSION.md
```

More detail: [docs/setup.md](docs/setup.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [SUBMISSION.md](SUBMISSION.md).
