# ADR 0002: Pure JavaScript with Zod Runtime Validation (No TypeScript)

## Status
Accepted

## Context
The team has chosen pure JavaScript. TypeScript would normally provide
compile-time safety at module boundaries, especially around AI I/O.

## Decision
Use JSDoc `@typedef` (in `packages/types`) for documentation/intellisense,
and Zod schemas as the enforced runtime safety net at every trust boundary:
API route input, AI Orchestrator output, and simulation params.

## Consequences
- No compile-time type errors — all boundary safety happens at runtime.
- Zod validation at these boundaries is treated as non-negotiable, not optional.
- Revisit if orchestrator complexity grows past what runtime checks can catch cheaply.
