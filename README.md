# Newton AI

AI-powered STEM learning platform for African secondary school students.
Built as a Turborepo monorepo — pure JavaScript (no TypeScript), Next.js 15, React 19.

See `docs/architecture/newton-ai-architecture-blueprint.md` for the full architecture document.

## Structure

- `apps/` — deployable Next.js applications (student-web, teacher-web, admin-web, parent-web, docs)
- `packages/` — shared internal packages (ai, database, ui, simulations, curriculum, etc.)
- `infrastructure/` — environment, deployment, and platform configuration
- `scripts/` — operational scripts (seeding, migrations, boundary checks)
- `docs/` — architecture decision records, onboarding, runbooks

## Getting Started

```bash
npm install
npm run dev
```

## Import Boundaries

Do not import `apps/*` from `packages/*`. Do not import one app from another app.
See `docs/architecture/newton-ai-architecture-blueprint.md` §5 for full dependency rules.
