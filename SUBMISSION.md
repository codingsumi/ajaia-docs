# Submission — Collaborative Docs

## Project summary

Collaborative Docs is a lightweight document editor where authenticated users create rich-text documents, share them with VIEW or EDIT permissions, and import plain text / Markdown files. It is implemented as an npm-workspaces monorepo: Next.js + Tiptap frontend, Express + Prisma backend, PostgreSQL database.

Realtime co-editing is not included; collaboration is permission-based sharing with server-enforced access control.

## Implemented features

- JWT login (seeded users; no registration API)
- Dashboard: my documents, shared with me, create, logout
- Tiptap editor with formatting toolbar and autosave
- Share by email (VIEW/EDIT), list shares, remove access (owner)
- VIEW-only UI and API enforcement
- Import `.txt` / `.md` → Tiptap JSON → new document → editor
- Health endpoint, Prisma schema/migration, demo seed script
- Backend automated API permission test
- Documentation: README, architecture, AI workflow

## Test / build results

Verified during deliverable preparation:

| Command | Result |
|---------|--------|
| `npm run test -w backend` | Pass (1 test suite / document permissions flow) |
| `npm run build -w frontend` | Pass (Next.js production build) |

Re-run before final submit:

```bash
npm run test -w backend
npm run build -w frontend
```

## Known limitations

- No realtime / multi-cursor collaboration
- No DOCX import; Markdown import is intentionally minimal
- JWT stored in `localStorage` (XSS tradeoff vs httpOnly cookies)
- Custom JWT helper (not the `jsonwebtoken` library)
- No refresh-token / logout denylist
- No public registration or password-reset flows
- ESLint is skipped during Next production build due to workspace parser resolution (`eslint.ignoreDuringBuilds`)
- Occasional Next.js `PageNotFoundError` during `next build` page-data collection; clearing `frontend/.next` and rebuilding resolves it
- Demo credentials are for local assessment only
- Repository is not initialized as a git repo yet; ensure `backend/.env` / `frontend/.env.local` stay untracked (patterns already in `.gitignore`)

## Deployment URL

TODO: Add public deployment URL after hosting.

## Demo credentials

| Email | Password |
|-------|----------|
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

Seed with: `npm run seed -w backend`

## Video URL

TODO: Add walkthrough / demo video URL.
