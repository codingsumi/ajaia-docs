# AI-assisted development workflow

This document describes how AI assistance was used while building Collaborative Docs, based on **known project/session context**. Items that need your personal recollection are marked **TODO**.

## Goal

Build a lightweight collaborative document editor for the Ajaia AI-Native Full Stack Developer assessment: Next.js + Express + Prisma + PostgreSQL + Tiptap, with auth, sharing, and file import—without realtime collaboration.

## Workflow style (observed in this Cursor session)

Development proceeded in **small, approval-gated steps**:

1. Inspect existing workspace / configs before changing anything
2. Propose concrete file changes and shell commands
3. Wait for explicit approval
4. Execute only the approved step
5. Verify (schema validate, migrate, test, production build) before continuing

This kept the monorepo setup, dependency installs, database work, backend APIs, frontend UI, and import feature from being applied in one opaque batch.

## Tools and environment (known)

| Tool / surface | Role in this project |
|----------------|----------------------|
| Cursor agent (Composer) | Implementation assistant for structure, backend, frontend, docs |
| Terminal / npm workspaces | Installs, Prisma CLI, Next build, Node test runner |
| Local PostgreSQL 16 | Primary database when Docker CLI was unavailable |
| Docker Compose file | Present for optional Postgres; not required once local Postgres was configured |
| Prisma Migrate | `init` migration for User / Document / DocumentShare |
| Node.js built-in `node:test` | Backend API permission test (no Jest/Vitest added) |

**TODO:** List any other AI tools, chat products, or IDEs you used outside this Cursor session.

## What AI helped with (known from this project)

- Establishing / verifying monorepo layout (`frontend`, `backend`, `docs`)
- Installing only missing frontend packages (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) after inventorying installed deps
- Designing a minimal Prisma schema (User, Document, DocumentShare, Permission enum)
- Implementing Express APIs: login JWT, documents CRUD, sharing, access checks
- Seeding two demo users with `scrypt` password hashes
- Building Next.js UI: login, dashboard, Tiptap editor, share panel, `.txt`/`.md` import
- Debugging environment issues that blocked progress:
  - Missing `node_modules/.bin` links → `npm install`
  - Docker unavailable → switched to local Postgres (after manual sudo setup)
  - Corrupted Next SWC native binary → reinstall `@next/swc-linux-x64-gnu`
  - Prisma client type stubs missing when install-scripts were gated
- Writing assessment deliverables (`README`, architecture, submission notes)

## Decisions made with AI assistance (known)

- Prefer **reuse of existing dependencies**; do not add packages without approval
- Implement JWT and password hashing with **Node `crypto`** instead of adding `jsonwebtoken` / `bcrypt`
- Keep schema/migrations stable once applied; evolve application code against existing APIs
- Treat VIEW/EDIT as server-enforced permissions, not UI-only rules
- Import flow: browser parse → `POST /documents` → `PATCH /documents/:id` → open editor
- Skip realtime collaboration and DOCX import by design

## Prompts and iteration

**TODO:** Paste representative prompts you used (setup, backend, frontend, debugging, docs), or link to exported chat history if allowed by the assessment.

Known interaction pattern in-session: instructions were task-scoped (“inspect first,” “show commands before running,” “wait for approval,” “do not install without approval”), which shaped a cautious, reviewable workflow rather than autonomous end-to-end coding.

## Human responsibilities (known + TODO)

Known human actions in this session:

- Approved stepwise plans (structure → deps → schema → Postgres → APIs → UI → import → docs)
- Completed local PostgreSQL password/database setup via sudo when the agent could not authenticate interactively
- Directed constraints (no Docker for some steps, no extra packages, no schema changes after migrate)

**TODO:** Note any additional manual design choices, code edits, or review criteria you applied independently.

## What worked well

- Explicit approval gates reduced accidental installs and scope creep
- Verifying against real `package.json` scripts and running builds/tests caught environment breakage early
- Keeping API contracts stable simplified frontend work and documentation

## Friction / lessons

- Workspace npm install-script gating and missing bin links required explicit repair steps
- Native tooling (Next SWC) can fail with opaque bus errors when binaries are corrupted
- Agent environments may lack interactive `sudo` / Docker; database setup may need a human terminal
- Transitive packages (e.g. Tiptap Underline via StarterKit) can satisfy features without declaring a direct dependency—document that choice for maintainers

## Assessment honesty

This project was built with substantial AI assistance under human direction and verification. Remaining blanks (**TODO**) should be filled with your own prompts, tools, and judgment before submission.
