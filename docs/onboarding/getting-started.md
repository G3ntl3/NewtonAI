# Getting Started

1. `nvm use` (Node 20+)
2. `npm install` at the repo root (installs all workspaces)
3. Copy `infrastructure/env/.env.example` to the repo root as `.env` and fill secrets
4. `npm run seed` — creates demo users + a student recovery code (see console output)
5. `npm run dev --workspace=student-web` — student portal on http://localhost:3000
6. Import `infrastructure/postman/Newton-AI-Auth.postman_collection.json` to test auth (see `docs/runbooks/auth-postman.md`)
7. Read `docs/architecture/newton-ai-architecture-blueprint.md` before adding a new module
