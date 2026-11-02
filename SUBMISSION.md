# Collaborative Document Editor — Submission

## 1. Project Overview

A lightweight collaborative document editor inspired by Google Docs. Users can create, edit, import, and share documents with other users using different permission levels.

The application focuses on document management, access control, content persistence, and a simple editing experience.

## 2. Live Application

- **Frontend:** https://ajaia-docs-swart-seven.vercel.app
- **Backend API:** https://ajaia-docs-api-l2bv.onrender.com
- **Backend Health Check:** https://ajaia-docs-api-l2bv.onrender.com/health
- **Source Code:** https://github.com/codingsumi/ajaia-docs

## 3. Demo Credentials

| User | Email | Password |
|---|---|---|
| Alice | alice@example.com | password123 |
| Bob | bob@example.com | password123 |

Both accounts are seeded demo users.

## 4. Implemented Features

### Authentication
- User login using email and password.
- JWT-based authentication.
- Protected document APIs.

### Document Management
- Create new documents.
- Rename and edit documents.
- View owned and shared documents separately.
- Automatically save document changes.
- Reopen documents with previously saved content.

### Rich Text Editor
- Bold, italic, and underline formatting.
- Headings and text styles.
- Bulleted and numbered lists.
- Toolbar formatting controls.

### File Import
- Import Markdown (`.md`) files.
- Import plain text (`.txt`) files.
- Imported content is converted into editor content.

### Document Sharing
- Share documents with other users.
- **VIEW permission:** User can view but cannot edit.
- **EDIT permission:** User can view and modify the document.
- Document owners can manage sharing permissions.
- Permission checks are enforced by the backend.

### Data Persistence
- Documents and editor content are stored in PostgreSQL.
- Sharing permissions persist in the database.
- Changes remain available after refreshing the page or logging in again.

## 5. Video Walkthrough

**Video URL:** https://www.awesomescreenshot.com/video/58009374?key=38610e39e4ee5f2cb468313022c98756

The walkthrough demonstrates the following workflow:

1. Alice logs in and creates a new document.
2. Alice adds content and shares the document with Bob using VIEW permission.
3. Bob logs in and opens the shared document.
4. Bob verifies that he can view the document but cannot edit it.
5. Bob imports a Markdown (`.md`) file.
6. Bob shares the imported document with Alice using EDIT permission.
7. Alice logs in and opens the document shared by Bob.
8. Alice updates the document content.
9. The page is refreshed to verify that the updated content remains persisted.

This demonstrates authentication, document creation, Markdown import, VIEW and EDIT permissions, cross-user document sharing, and persistent storage.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Rich Text Editor | Tiptap |
| Authentication | JWT |
| Password Hashing | Node.js scrypt |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Neon |

## 7. Testing and Validation

The following validations were performed:

- Backend API health check.
- User login and authentication.
- Document creation and retrieval.
- Document editing and persistence.
- VIEW permission prevents document editing.
- EDIT permission allows document editing.
- Non-owner cannot delete another user's document.
- Frontend production build completed successfully.
- Backend automated API tests passed.
- Production application workflows were manually verified.

## 8. Architecture and Design Decisions

The application uses a separate frontend and backend architecture.

- Next.js handles the user interface and editor experience.
- Express provides REST APIs and handles authentication, document operations, and permission checks.
- PostgreSQL stores users, documents, and sharing permissions.
- Prisma manages database access and migrations.
- Tiptap stores rich-text editor content as structured JSON.
- Backend authorization ensures that document access follows the owner's sharing permissions.

The implementation prioritizes a lightweight architecture and clear separation of responsibilities.

## 9. Known Limitations and Future Improvements

The current implementation intentionally focuses on the core assignment requirements.

Potential improvements include:

- Real-time collaborative editing.
- Live presence indicators.
- Comments and discussion threads.
- Document version history.
- Additional import and export formats.
- Token refresh and revocation.
- More extensive automated frontend and integration tests.

Real-time collaboration is not currently implemented.

## 10. Setup and Documentation

Please refer to the repository for:

- `README.md` — installation, environment configuration, database setup, and run instructions.
- `docs/ARCHITECTURE.md` — architecture and technical decisions.
- `docs/AI_WORKFLOW.md` — AI-assisted development workflow.
- `docs/setup.md` — additional setup instructions.

## 11. Submission Summary

The application delivers the core requirements of the assignment: authenticated document management, rich-text editing, Markdown and TXT import, document sharing with VIEW and EDIT permissions, backend authorization, and persistent storage.

The deployed application and source code are provided above, along with a video walkthrough demonstrating the main user workflows.