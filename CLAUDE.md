# CLAUDE.md — Newton AI

You are working on Newton AI, a Socratic STEM tutor for African secondary school
students. Read this file fully before any task. These are hard constraints, not
suggestions. When a request conflicts with this file, STOP and ask — do not
silently resolve the conflict.

## Prime directive: do not invent, do not drift

- Do NOT introduce libraries, services, patterns, or architecture that are not
  already established in this repo or explicitly requested. No "best practice"
  substitutions.
- If something needed to complete a task is missing or ambiguous, STOP and ask a
  specific question. Never guess a schema, an API shape, an env var name, or a
  file's location. A wrong guess is worse than a question.
- Do NOT reverse decisions recorded here because you think a different choice is
  better. If you believe a decision is wrong, say so in one sentence and wait —
  do not act on it.
- Never fabricate: no placeholder data presented as real, no invented function
  names from other files, no imagined config. If you haven't seen it, say so.
- Prefer editing existing files over creating new ones. Do not create files the
  task didn't ask for (no extra READMEs, no scaffolding sprawl).

## Locked technical decisions (do not change without being told)

- **Language: JavaScript only. No TypeScript.** Type safety = JSDoc @typedef +
  Zod at every trust boundary. Do not add `.ts` files or a tsconfig.
- **Database: MongoDB via Mongoose.** NOT Supabase, NOT Postgres, NOT Prisma.
  Mongoose has no row-level security, so EVERY query must enforce ownership in
  code (a student can only ever read/write their own data).
- **AI model: Google Gemini, isolated in ONE file** —
  `packages/ai/src/providers/GeminiProvider.js`. Gemini is imported NOWHERE else.
  Model name comes from `process.env.NEWTON_GEMINI_MODEL` (default
  `gemini-3-flash`). Never hardcode a model string elsewhere.
- **Hosting: Vercel (Hobby tier for now).** API routes are serverless functions;
  there is no separate backend server. Assume a 10s function timeout — AI calls
  MUST stream. Mongoose routes use `export const runtime = 'nodejs'`.
- **Auth: hand-rolled JWT + recovery codes** (see `packages/auth`). Recovery
  codes and passwords are ALWAYS hashed (argon2/bcrypt), never stored plaintext.
- **Monorepo boundaries are enforced (see architecture doc §5).** `apps/*` may
  import `packages/*`; packages never import apps; apps never import each other.
  `ui` imports only `types` + `utils`. `simulations` never imports `ai` or
  `database`.

## The Socratic session — the core product logic

The reveal level (how much the tutor gives away) is owned by CODE, not the model.
The pattern is **AI-suggested, code-approved**, and it must not be weakened:

- The model receives the CURRENT reveal level and RECOMMENDS advancing it. It
  can never set or raise the level itself.
- `MasteryEngine.decideRevealLevel()` is the only place the level changes. Its
  guardrails (min exchanges per level, max one advance per turn, hard veto on a
  bare "just give me the answer") must not be removed or loosened.
- All Gemini output passes `tutorTurnSchema.parse()` before it touches state or
  the client. Unvalidated model output is never trusted.
- This is the product's moat. Any task that would let the model control the
  reveal level, skip validation, or bypass the guardrails is WRONG — refuse and
  flag it.

## MVP scope discipline

We are building an MVP to demo to schools, solo-founder budget, free Gemini key.

- Build the STUDENT experience only. Do NOT build teacher/parent/admin portals,
  analytics engines, knowledge graphs, feature flags, or multi-provider AI
  abstraction unless explicitly asked. They are future work.
- Learning-block types, kept deliberately small: chat, quiz, simulation,
  subjectSwitch, formula. Adding a new type is a real product decision, not a
  default — don't add a sixth without stopping to confirm it's warranted.
- Simulations mapped to the pilot syllabus: projectile-motion, graph-explorer,
  quadratic-explorer, ohms-law. Same rule — don't add a fifth by default.
- Simplicity over cleverness. Fewer files, smaller functions, obvious code a
  tired founder can read at midnight.

## Working method

1. Before coding, restate the task in one line and list any assumption you're
   forced to make. If you have to assume anything load-bearing, ask instead.
2. Make the smallest change that satisfies the task. Show the plan for anything
   touching more than ~2 files before writing.
3. After changes: state what you changed, what you did NOT touch, and anything
   left as a TODO. Never claim something works that you haven't verified.
4. Match the existing style exactly (naming, structure — see architecture doc §7).

## Session & concept model

- A chat session is identified by (studentId, subject). One chat per subject
  per student — enforced by a unique index, not just code.
- Subjects: physics, chemistry, biology, maths.
- A new chat starts with NO concept. The concept is set by the student's own
  prompt ("what would you like to explore?"), never seeded or picked by the AI.
- Concept is nullable and CAN shift within a subject chat. When a concept is
  first established OR changes, the reveal ladder resets to level 0.
- The model PROPOSES a concept via a validated `conceptUpdate` signal; CODE
  records it. Same AI-suggests/code-decides rule as reveal level and sims.



## Reference

The full architecture blueprint lives at
`docs/architecture/newton-ai-architecture-blueprint.md`. It is the source of
truth for structure. This file is the source of truth for behavior. If they ever
disagree, ask.