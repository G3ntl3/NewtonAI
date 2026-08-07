# ADR 0001: Turborepo Monorepo over Single Repository

## Status
Accepted

## Context
Newton AI will grow into four portals (Student, Teacher, Parent, Admin) sharing
an AI Orchestrator, database layer, and design system.

## Decision
Adopt a Turborepo monorepo (`apps/*`, `packages/*`) from day one rather than
starting as a single Next.js app and migrating later.

## Consequences
- Shared logic (AI, database, UI) lives once, versioned, in `packages/`.
- Each portal deploys independently on Vercel.
- Slightly higher initial setup cost, but avoids an expensive later migration.
