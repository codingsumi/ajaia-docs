# Architecture

## Overview

The app is an npm-workspaces monorepo with a Next.js frontend and an Express + Prisma backend sharing a PostgreSQL database.

```
Browser (Next.js)
    │  JSON over HTTP + Bearer JWT
    ▼
Express API (port 4000)
    │  Prisma Client
    ▼
PostgreSQL (User, Document, DocumentShare)
```

Realtime sync (WebSockets / CRDT) is not implemented. Collaboration is “share + edit with permissions,” not live co-editing.

## Frontend architecture

- **Next.js App Router** under `frontend/src/app`
  - `/login` — credentials form
  - `/dashboard` — document lists, create, import
  - `/documents/[id]` — editor + sharing
- **Client-side auth gate** via `RequireAuth` (token + user in `localStorage`)
- **API layer** — `frontend/src/lib/api.ts` centralizes `fetch`, attaches `Authorization`, and redirects to `/login` on `401`
- **Editor** — Tiptap (`StarterKit` + `Underline`) in `DocumentEditor`, with debounced `PATCH` autosave
- **Import** — browser `File` read in `importFile.ts`, then create + update via existing document APIs

UI state (loading / empty / error) is handled per page/component without a global state library.

## Backend architecture

- **Express app factory** — `backend/src/app.ts` mounts routers and a shared error handler
- **Routes**
  - `/auth` — login, current user
  - `/documents` — CRUD-ish document APIs + share management
- **Libraries**
  - `lib/password.ts` — `scrypt` hash/verify
  - `lib/jwt.ts` — minimal HS256 JWT (no `jsonwebtoken` dependency)
  - `lib/access.ts` — ownership / share permission checks
  - `lib/serialize.ts` — strips password hashes from responses
- **Prisma** — schema and migrations under `backend/prisma`

## API communication

- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- JSON request/response bodies
- Protected routes expect `Authorization: Bearer <token>`
- Representative endpoints:
  - `POST /auth/login`
  - `GET /auth/me`
  - `GET|POST /documents`, `GET /documents/shared`
  - `GET|PATCH|DELETE /documents/:id`
  - `GET|POST /documents/:id/shares`, `DELETE /documents/:id/shares/:shareId`

CORS is enabled for local frontend development.

## Database relationships

```
User 1 ─── * Document (owner)
User 1 ─── * DocumentShare
Document 1 ─── * DocumentShare
```

- **User**: `id`, `name`, `email` (unique), `password` (scrypt hash), `createdAt`
- **Document**: `id`, `title`, `content` (JSON / jsonb), `ownerId`, timestamps
- **DocumentShare**: `documentId` + `userId` unique pair, `permission` enum `VIEW` | `EDIT`
- Cascading deletes from owner user / document remove dependent rows

## Authentication and authorization

1. Login verifies email + scrypt password hash
2. Server issues JWT (`sub`, `email`, `iat`, `exp`) signed with `JWT_SECRET`
3. `requireAuth` middleware validates JWT and loads the user
4. Document access:
   - **OWNER** — full control (edit, delete, manage shares)
   - **EDIT** — read/write content and title; cannot delete or manage shares
   - **VIEW** — read only; backend rejects `PATCH` / delete / share mutations
5. Missing access returns `404` for document fetch (avoid leaking existence) or `403` when the user has weaker-than-required access

Frontend hides edit/share controls for VIEW users; **authorization is enforced on the server**.

## Document persistence

- Tiptap document JSON is stored in `Document.content`
- Title and content updates go through `PATCH /documents/:id`
- Frontend autosaves after short idle debounce; status reflects Saving / Saved / Error
- Default empty content is a valid Tiptap doc (`{ type: "doc", content: [...] }`)

## File import flow

1. Dashboard **Import File** selects `.txt` or `.md`
2. Browser reads file text (`File.text()`)
3. Extension and non-empty content are validated
4. Text is converted to Tiptap JSON (`textToTiptapJSON`)
5. `POST /documents` creates a document (title from filename)
6. `PATCH /documents/:id` writes imported content
7. Client navigates to `/documents/:id`

DOCX and server-side parsing are out of scope.

## Important technical decisions and tradeoffs

| Decision | Rationale / tradeoff |
|----------|----------------------|
| JWT in `localStorage` | Simplest SPA-friendly approach; vulnerable to XSS vs httpOnly cookies |
| Custom JWT + `scrypt` with Node `crypto` | Avoided extra auth packages; less battle-tested than `jsonwebtoken` / `bcrypt` |
| No registration API | Matches assessment scope; demo users via seed |
| No realtime collaboration | Reduced complexity; shares are permission-based, not live CRDT |
| Minimal Markdown importer | No parser dependency; supports headings/lists/paragraphs only |
| npm workspaces | Shared install; occasional toolchain friction (SWC binary, ESLint path, Prisma postinstall scripts) |
| Optional Docker Compose | Local Postgres works without Docker when Compose is unavailable |

## Security notes

- Password hashes are never returned in API JSON
- Change `JWT_SECRET` and DB credentials outside local demo use
- Production should use HTTPS, stricter CORS, and prefer httpOnly cookie session storage if hardening further
