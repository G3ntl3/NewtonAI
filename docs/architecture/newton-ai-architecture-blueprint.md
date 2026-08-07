# Newton AI — Platform Architecture Blueprint
### Pure JavaScript (No TypeScript) · Turborepo Monorepo · Next.js 15 / React 19

**Author role:** Lead Architect
**Scope:** Structural design only — no application/business logic code is included below. Where a file appears in the tree, it represents a *placeholder with a documented responsibility*, not an implementation.

---

## 1. Foundational Decision: Monorepo vs Single Repository

**Decision: Turborepo monorepo, adopted from day one.**

| Criterion | Single Repo | Turborepo Monorepo | Verdict |
|---|---|---|---|
| Multiple portals (Student/Teacher/Parent/Admin) | Route groups get tangled; RBAC bleeds into routing | Each portal is its own deployable app | **Monorepo** |
| Shared AI Orchestrator, UI kit, DB models | Duplicated or awkwardly nested | Versioned internal packages, single source of truth | **Monorepo** |
| Independent deploy cadence (e.g. Admin ships less often) | Forces one deploy pipeline | Per-app Vercel projects, independent pipelines | **Monorepo** |
| 1M+ students, multi-country, multi-curriculum | Harder to isolate blast radius | `packages/curriculum`, `packages/i18n` isolate change | **Monorepo** |
| Onboarding cost early on | Lower initial ceremony | Slightly higher initial setup | Single Repo (short-term only) |
| CI build time at scale | Rebuilds everything | Turborepo caches + only rebuilds affected packages | **Monorepo** |

Given the stated 5-year trajectory (voice tutoring, AR labs, competitions, marketplace, teacher AI assistant, multi-country curricula), the short-term convenience of a single repo is outweighed almost immediately. **Monorepo is the correct call, and it should be set up before the first feature is built**, not migrated to later — migrating a live single-repo Next.js app into a monorepo mid-flight is expensive and introduces regression risk in exactly the systems (auth, AI orchestrator) you can least afford to destabilize.

**Important JS-specific note:** because there is no TypeScript, cross-package "contracts" (shapes of data passed between `packages/ai`, `packages/database`, and the apps) are enforced at **runtime** via Zod schemas living in `packages/types`, and documented via JSDoc `@typedef`. This replaces the compile-time safety TypeScript would normally provide — see §7.3.

---

## 2. Complete Folder Structure (ASCII Tree)

```
newton-ai/
│
├── apps/
│   ├── student-web/                     # Student Portal — primary consumer app
│   │   ├── src/
│   │   │   ├── app/                     # Next.js App Router
│   │   │   │   ├── (auth)/              # Route group: login, recovery-code, forgot-password
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── recovery/
│   │   │   │   │   └── layout.jsx
│   │   │   │   ├── (dashboard)/         # Route group: authenticated student shell
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── chat/            # AI Chat / Socratic tutoring surface
│   │   │   │   │   ├── lab/             # Virtual Laboratory
│   │   │   │   │   ├── flashcards/
│   │   │   │   │   ├── bookmarks/
│   │   │   │   │   ├── goals/
│   │   │   │   │   ├── progress/        # Mastery + Analytics views
│   │   │   │   │   ├── achievements/    # Gamification
│   │   │   │   │   └── layout.jsx       # Dashboard shell (nav, sidebar, providers)
│   │   │   │   ├── api/                 # Route Handlers (thin — delegate to services)
│   │   │   │   │   ├── chat/route.js
│   │   │   │   │   ├── simulations/route.js
│   │   │   │   │   ├── assessments/route.js
│   │   │   │   │   ├── mastery/route.js
│   │   │   │   │   └── recommendations/route.js
│   │   │   │   ├── layout.jsx           # Root layout
│   │   │   │   ├── error.jsx
│   │   │   │   ├── not-found.jsx
│   │   │   │   └── globals.css
│   │   │   ├── components/              # App-local, non-shared components only
│   │   │   │   ├── learning-blocks/      # Learning Block System (see §4.2)
│   │   │   │   │   ├── ChatBlock/
│   │   │   │   │   ├── QuizBlock/
│   │   │   │   │   ├── FormulaBlock/
│   │   │   │   │   ├── SimulationBlock/
│   │   │   │   │   ├── GraphBlock/
│   │   │   │   │   ├── ReflectionBlock/
│   │   │   │   │   ├── ImageBlock/
│   │   │   │   │   ├── VideoBlock/
│   │   │   │   │   ├── MarkdownBlock/
│   │   │   │   │   ├── HintBlock/
│   │   │   │   │   ├── LearningBlockRenderer.jsx   # Dispatch by block.type
│   │   │   │   │   └── index.js         # Barrel export
│   │   │   │   ├── dashboard/
│   │   │   │   ├── lab/
│   │   │   │   └── gamification/
│   │   │   ├── hooks/                    # App-local hooks
│   │   │   │   ├── useConversation.js
│   │   │   │   ├── useMasteryState.js
│   │   │   │   └── useSimulationSession.js
│   │   │   ├── stores/                   # Zustand stores (client state)
│   │   │   │   ├── conversationStore.js
│   │   │   │   ├── uiStore.js
│   │   │   │   └── sessionStore.js
│   │   │   ├── contexts/                 # React Context providers (theme, auth session)
│   │   │   ├── lib/                      # App-local glue code (not shared)
│   │   │   ├── styles/
│   │   │   └── middleware.js             # Auth guard, locale detection
│   │   ├── public/
│   │   ├── tests/
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── jsconfig.json                 # Path aliases (JS equivalent of tsconfig)
│   │   └── package.json
│   │
│   ├── teacher-web/                       # Teacher Portal (class mgmt, reports, AI co-teacher)
│   │   └── src/app/(dashboard)/{classes,reports,assignments,teacher-assistant}/...
│   │
│   ├── admin-web/                         # School Admin + Super Admin Portal
│   │   └── src/app/(dashboard)/{schools,users,billing,curriculum-config,audit-logs}/...
│   │
│   ├── parent-web/                        # Parent Portal (child progress, notifications)
│   │   └── src/app/(dashboard)/{children,progress,messages}/...
│   │
│   └── docs/                              # Internal architecture docs site (Nextra/Docusaurus)
│
├── packages/
│   ├── ui/                                # Design System / component library
│   │   ├── src/
│   │   │   ├── primitives/                # Button, Input, Card, Modal, Tabs...
│   │   │   ├── composite/                 # DataTable, StatCard, ProgressRing...
│   │   │   ├── layout/                    # AppShell, Sidebar, PortalHeader
│   │   │   ├── theme/                     # tokens.js, colors.js, typography.js
│   │   │   ├── icons/
│   │   │   └── index.js
│   │   └── package.json
│   │
│   ├── ai/                                 # AI Orchestrator (Gemini isolated here — §4.1)
│   │   ├── src/
│   │   │   ├── orchestrator/
│   │   │   │   ├── ConversationManager.js
│   │   │   │   ├── PromptBuilder.js
│   │   │   │   ├── ContextBuilder.js
│   │   │   │   ├── LearningProfileLoader.js
│   │   │   │   ├── CurriculumLoader.js
│   │   │   │   ├── SimulationSelector.js
│   │   │   │   ├── TeachingStrategyEngine.js
│   │   │   │   ├── AssessmentEngine.js
│   │   │   │   ├── MasteryEngine.js
│   │   │   │   ├── ResponseParser.js
│   │   │   │   ├── LearningBlockBuilder.js
│   │   │   │   ├── MemoryManager.js
│   │   │   │   ├── CostOptimizer.js
│   │   │   │   └── Guardrails.js
│   │   │   ├── providers/                 # Provider abstraction (multi-AI-provider ready)
│   │   │   │   ├── GeminiProvider.js
│   │   │   │   └── ProviderInterface.js   # JSDoc-defined contract all providers must satisfy
│   │   │   ├── prompt-templates/
│   │   │   │   ├── socratic/
│   │   │   │   ├── assessment/
│   │   │   │   └── remediation/
│   │   │   └── index.js                   # Only exported surface: `runOrchestration(input)`
│   │   └── package.json
│   │
│   ├── database/                           # Mongoose models + repositories
│   │   ├── src/
│   │   │   ├── models/                    # Mongoose schemas (User, School, Class, ...)
│   │   │   ├── repositories/               # Data-access layer — only place models are queried
│   │   │   ├── migrations/
│   │   │   ├── seeders/
│   │   │   └── connection.js
│   │   └── package.json
│   │
│   ├── simulations/                        # Simulation Registry (§4.3) — reusable React components
│   │   ├── src/
│   │   │   ├── registry.js                 # id -> component + param schema map
│   │   │   ├── ProjectileMotion/
│   │   │   ├── CircuitBuilder/
│   │   │   ├── Titration/
│   │   │   ├── MoleculeBuilder/
│   │   │   ├── PeriodicTable/
│   │   │   ├── GraphExplorer/
│   │   │   └── shared/                     # Physics/canvas helpers shared across sims
│   │   └── package.json
│   │
│   ├── curriculum/                         # Curriculum Engine
│   │   ├── src/{loaders,mappers,validators}/
│   │   └── package.json
│   │
│   ├── assessment/                         # Assessment Engine (quiz gen, scoring, rubrics)
│   │   ├── src/{generators,scorers,rubrics}/
│   │   └── package.json
│   │
│   ├── analytics/                          # Analytics + Recommendation Engine
│   │   ├── src/{aggregators,recommenders,reports}/
│   │   └── package.json
│   │
│   ├── knowledge-graph/                    # Topic/prerequisite graph
│   │   ├── src/{graph,traversal}/
│   │   └── package.json
│   │
│   ├── auth/                               # JWT, refresh tokens, RBAC, recovery codes
│   │   ├── src/{jwt,rbac,recovery-codes,session}/
│   │   └── package.json
│   │
│   ├── notifications/                      # Firebase Cloud Messaging abstraction
│   │   ├── src/{fcm,templates,queue}/
│   │   └── package.json
│   │
│   ├── media/                               # Cloudinary abstraction (upload, transform, sign)
│   │   └── src/
│   │
│   ├── config/                              # Shared runtime config, env schema (Zod)
│   │   ├── src/env.js                       # Validates process.env at boot
│   │   └── package.json
│   │
│   ├── types/                                # JSDoc @typedef + Zod schemas (shared "contracts")
│   │   ├── src/{user,conversation,mastery,simulation,api}.js
│   │   └── package.json
│   │
│   ├── utils/                                # Pure, generic, side-effect-free helpers
│   │   ├── src/{date,string,number,array,validation}.js
│   │   └── package.json
│   │
│   ├── logger/                               # Sentry + structured logging wrapper
│   │   └── src/
│   │
│   ├── eslint-config/                        # Shared lint rules
│   ├── jest-config/                          # Shared test config
│   └── prettier-config/
│
├── infrastructure/
│   ├── vercel/                              # Per-app Vercel project configs
│   ├── mongodb/                             # Atlas index definitions, backup policy docs
│   ├── redis/                               # Phase 2 caching config
│   └── env/                                 # .env.example per app/package
│
├── scripts/
│   ├── seed-db.js
│   ├── generate-recovery-codes.js
│   ├── migrate.js
│   └── check-orphan-imports.js              # Enforces dependency boundaries (§5)
│
├── docs/
│   ├── architecture/                        # This document + ADRs
│   ├── onboarding/
│   └── runbooks/
│
├── .github/
│   └── workflows/                           # CI: lint, test, build (Turborepo remote cache)
├── turbo.json
├── package.json                              # Workspaces root
└── jsconfig.base.json                        # Base path-alias config extended by each app
```

---

## 3. Top-Level Folder Rationale

| Folder | Why it exists |
|---|---|
| `apps/` | Deployable units. Each is a full Next.js app with its own auth boundary, its own Vercel project, its own deploy cadence. No app imports another app directly. |
| `packages/` | All shared logic. Anything used by 2+ apps lives here, never copy-pasted. |
| `infrastructure/` | Environment and platform configuration that isn't code — keeps ops concerns out of app source. |
| `scripts/` | One-off or repeatable operational scripts (seeding, migration, boundary linting) that shouldn't live inside any single app. |
| `docs/` | Architecture Decision Records (ADRs), runbooks, onboarding — versioned alongside the code it describes. |

---

## 4. Major Module Deep-Dives

### 4.1 AI Orchestrator (`packages/ai`)

**Rule: Gemini is never imported outside `packages/ai/src/providers/GeminiProvider.js`.**

Flow for a single tutoring turn:

```
Route Handler (apps/student-web/src/app/api/chat/route.js)
        │
        ▼
packages/ai  →  ConversationManager
                     │
        ┌────────────┼─────────────────────┐
        ▼            ▼                     ▼
LearningProfileLoader  CurriculumLoader   MemoryManager
        │            │                     │
        └────────────┴──────────┬──────────┘
                                 ▼
                         ContextBuilder
                                 ▼
                          PromptBuilder  ──uses──▶ prompt-templates/
                                 ▼
                          Guardrails (pre-flight check)
                                 ▼
                          CostOptimizer (model/token routing)
                                 ▼
                          GeminiProvider.generate()
                                 ▼
                          ResponseParser
                                 ▼
                       LearningBlockBuilder ──▶ SimulationSelector (if sim needed)
                                 ▼
                    { blocks: [...], masteryDelta, nextRecommendation }
                                 ▼
                     returned to route handler → sent to client
```

The orchestrator's **only public export** is a single function, e.g. `runOrchestration(sessionInput)`, returning a Zod-validated payload shape (`packages/types/src/conversation.js`). No app ever touches the internal orchestrator modules directly — this is the enforceable dependency boundary that keeps prompt logic, cost logic, and guardrails from leaking into route handlers.

### 4.2 Learning Block System (`apps/*/src/components/learning-blocks`)

The AI never returns raw HTML/markdown-only. It returns a typed array of **blocks**:

```js
// Shape (documented via JSDoc in packages/types/src/conversation.js)
/**
 * @typedef {Object} LearningBlock
 * @property {'chat'|'quiz'|'formula'|'simulation'|'graph'|'reflection'|'image'|'video'|'markdown'|'hint'} type
 * @property {Object} payload
 */
```

`LearningBlockRenderer.jsx` is the single dispatch point — a switch over `block.type` rendering the matching `*Block` component. New block types require: (1) a new folder under `learning-blocks/`, (2) a registry entry, (3) a schema addition in `packages/types`. Nothing else in the app needs to change.

### 4.3 Simulation Registry (`packages/simulations`)

Gemini **never generates simulation code**. It returns only:

```js
{ simulationId: 'projectile-motion', params: { angle: 45, velocity: 20 }, objectives: [...] }
```

`registry.js` maps `simulationId → { Component, paramSchema }`. The `SimulationBlock` in the app looks up the registry, validates `params` against `paramSchema` (Zod) before rendering, and renders the trusted, pre-built React component. This is a critical safety boundary: **AI output can select a simulation and its parameters, but can never inject arbitrary rendering logic.**

### 4.4 Backend Layering (per API route)

```
Route Handler (route.js)      → parses request, calls a Controller, returns Response
        ↓
Controller                    → orchestrates one use case, no DB/AI calls directly
        ↓
Service                       → business logic (e.g. "submit quiz attempt, update mastery")
        ↓
Repository (packages/database)→ only place Mongoose models are queried
        ↓
Model (Mongoose schema)
```

Validation (Zod) sits at the Controller boundary — nothing below the Controller trusts unvalidated input.

---

## 5. Dependency & Import Rules

**Direction of allowed imports (enforced by `scripts/check-orphan-imports.js` + ESLint `no-restricted-imports`):**

```
apps/*  ──▶  packages/*        (allowed)
packages/* ──▶ packages/*      (allowed, but see restrictions below)
packages/* ──▶ apps/*          (FORBIDDEN — packages must never know about apps)
apps/A  ──▶  apps/B            (FORBIDDEN — apps never import each other directly)
```

**Package-to-package restrictions:**

| Package | May import | Must NOT import |
|---|---|---|
| `ai` | `database`, `curriculum`, `types`, `utils`, `config`, `logger` | `ui`, any `apps/*` |
| `simulations` | `ui`, `types`, `utils` | `database`, `ai` (simulations render params; they don't fetch data) |
| `database` | `types`, `utils`, `config`, `logger` | `ai`, `ui`, `simulations` |
| `ui` | `types`, `utils` only | Everything else — `ui` must be app-agnostic and AI-agnostic |
| `auth` | `database`, `types`, `utils`, `config` | `ai`, `ui` |

**Rule of thumb:** if you find yourself importing `packages/ai` into `packages/ui`, or a repository function directly into a React component, that's a boundary violation — route it through a Service/Controller or a hook that calls the app's own API route.

---

## 6. Path Aliases (per app, via `jsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/stores/*": ["src/stores/*"],
      "@/lib/*": ["src/lib/*"],
      "@newton/ui/*": ["../../packages/ui/src/*"],
      "@newton/ai": ["../../packages/ai/src/index.js"],
      "@newton/database/*": ["../../packages/database/src/*"],
      "@newton/simulations": ["../../packages/simulations/src/registry.js"],
      "@newton/types/*": ["../../packages/types/src/*"],
      "@newton/utils/*": ["../../packages/utils/src/*"]
    }
  }
}
```

In practice, cross-package imports resolve via workspace package names (`@newton/ai`, declared in each package's `package.json`) rather than relative aliasing — the `jsconfig` paths above are for editor/IntelliSense convenience and app-local (`@/`) shortcuts.

---

## 7. Naming Conventions

### 7.1 Folders & Files
- Folders: `kebab-case` (`learning-blocks`, `knowledge-graph`).
- React component files: `PascalCase.jsx` (`QuizBlock.jsx`), colocated with `QuizBlock.module.css` or Tailwind-only, and `QuizBlock.test.js`.
- Non-component JS modules: `camelCase.js` (`promptBuilder.js`) — **exception:** orchestrator "engine" classes use `PascalCase.js` since they're class-based singletons (`MasteryEngine.js`), matching the tree above.
- Route handler files: always `route.js` (Next.js convention, not negotiable).

### 7.2 Components / Hooks
- Components: `PascalCase`, noun-based (`SimulationBlock`, `MasteryRing`).
- Hooks: `useCamelCase`, verb-first where possible (`useMasteryState`, `useConversation`).
- Zustand stores: `camelCaseStore` (`conversationStore.js`), exporting `useConversationStore`.

### 7.3 "Types" Without TypeScript

Since the stack is **strictly JavaScript**, type safety is replaced by two complementary layers:

1. **JSDoc `@typedef`** for editor intellisense and documentation — lives in `packages/types/src/*.js`, imported via comment reference (`/** @type {import('@newton/types').LearningBlock} */`). Costs nothing at runtime.
2. **Zod schemas** (already in your stack for forms) for **runtime** validation at every trust boundary: API route input, AI orchestrator output, simulation params. This is non-negotiable for the AI layer specifically — you cannot statically type-check what Gemini returns, so Zod is your actual safety net, not a nicety.

Naming: typedefs `PascalCase` (`LearningBlock`), Zod schemas suffixed `Schema` (`learningBlockSchema`).

### 7.4 Enums (as frozen objects, JS has no native enum)
```js
export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin',
});
```
Naming: `SCREAMING_SNAKE_CASE` object name, `UPPER_CASE` keys, lowercase `snake_case` string values (matches DB storage and API payloads).

### 7.5 Constants
- File-level constants: `SCREAMING_SNAKE_CASE`.
- Grouped in `packages/utils/src/constants/` by domain (`mastery.constants.js`, `simulation.constants.js`).

### 7.6 API Naming
- REST-ish, resource-based, plural nouns: `/api/conversations`, `/api/assessments/:id/attempts`.
- Actions that aren't pure CRUD use a verb suffix sparingly: `/api/mastery/recalculate`.

### 7.7 Environment Variables
`NEWTON_<DOMAIN>_<NAME>`, e.g. `NEWTON_GEMINI_API_KEY`, `NEWTON_MONGODB_URI`, `NEWTON_JWT_SECRET`, `NEWTON_FCM_SERVER_KEY`. Validated at boot by `packages/config/src/env.js` (Zod schema — fail fast if a required var is missing, rather than failing deep inside the orchestrator at request time).

### 7.8 Git & Commits
- Branches: `type/short-description` — `feat/mastery-engine`, `fix/quiz-scoring-rounding`, `chore/turbo-cache-config`.
- Commits: Conventional Commits — `feat(ai): add cost optimizer token budget check`, `fix(simulations): correct titration ph curve bounds`.

---

## 8. Scalability Notes (toward 1M students, multi-country)

- **Curriculum isolation:** `packages/curriculum` is designed around a `countryCode + curriculumId` composite key from day one (e.g. `NG-WAEC`, `KE-KCSE`) — even though only one curriculum ships at launch, the schema and loaders should never assume a single global curriculum.
- **Multi-provider AI:** `packages/ai/src/providers/ProviderInterface.js` defines the contract (`generate(prompt, options)`); adding a second provider (e.g. an open-weights model for cost-sensitive markets) means writing one new file, not touching the orchestrator.
- **Redis (Phase 2):** slots in at `MemoryManager` (conversation context cache) and `CostOptimizer` (token-budget/session cache) without touching route handlers — plan the interface now even if Redis isn't wired until Phase 2.
- **Offline support:** service-worker + IndexedDB caching belongs in `apps/student-web/src/lib/offline/`, syncing through the same repository interfaces so the sync layer doesn't need special-case backend endpoints.
- **CI at scale:** Turborepo remote caching means a change to `apps/admin-web` alone doesn't rebuild `student-web` or re-test `packages/simulations`.

---

## 9. Placement of Future Features (examples)

| Feature | Where it lands |
|---|---|
| Voice tutoring | New `packages/ai/src/providers/VoiceProvider.js` + new block type `voice` in Learning Block System; STT/TTS glue in a new `packages/voice` if it grows large enough to warrant isolation. |
| AR laboratories | New package `packages/ar-lab`, following the exact same "registry + trusted component" pattern as `packages/simulations` — AI selects an AR scene ID and params, never generates AR code. |
| Competition platform | New app `apps/competitions-web` (own deploy cadence, own RBAC needs) reusing `packages/ui`, `packages/auth`, `packages/database`. |
| Marketplace (resources, tutors) | New package `packages/marketplace` (catalog, payments abstraction) + new route group inside relevant portals. |
| Teacher AI assistant | Extends `packages/ai` with a `TeacherStrategyEngine.js` sibling to `TeachingStrategyEngine.js`, surfaced only in `apps/teacher-web`. |

The pattern to defend, always: **new capability → new package or new registry entry, never a new special-case branch inside an existing engine.**

---

## 10. Package Structure If Apps Multiply Further

Already reflected in §2 (`student-web`, `teacher-web`, `admin-web`, `parent-web`). If the platform later needs, e.g., a standalone mobile app (React Native/Expo), it becomes `apps/student-mobile/`, consuming the *same* `packages/ai`, `packages/database`-backed API (via HTTP, not direct import — mobile can't share server-only packages like `database` directly), and a mobile-specific `packages/ui-native` sibling to `packages/ui` if the design system needs a native variant.

---

## 11. Recommendations Beyond the Original Ask

1. **Add an explicit `packages/guardrails-tests`** — a suite of adversarial prompts (jailbreak attempts, off-syllabus requests, requests for answers-without-reasoning) run in CI against `Guardrails.js` on every PR touching `packages/ai`. Pedagogical integrity is a core product guarantee here, not just a safety nicety — regressions should fail CI, not be caught in production.
2. **Add ADRs (Architecture Decision Records)** under `docs/architecture/adr/` starting now — decisions like "why Zod instead of TypeScript," "why Turborepo," "why simulation registry instead of AI-generated UI" are exactly the kind of thing a new engineer six months from now will ask "why isn't this X instead," and an ADR answers it in thirty seconds instead of a meeting.
3. **Formalize the Conversation Memory boundary now.** With Mastery, Conversation Memory, and Recommendation Engine all reading/writing overlapping student state, define ownership explicitly: `MemoryManager` owns conversation-turn history; `packages/analytics` owns derived mastery/progress aggregates; nothing else writes to either collection directly. Document this in `docs/architecture/data-ownership.md` before multiple engineers start writing to the same collections from different services.
4. **Reconsider "no TypeScript" only as a documented, revisitable decision, not a permanent constraint** — given how much of this system's safety (AI I/O boundaries, RBAC, simulation params) benefits from static shape-checking, worth explicitly recording *why* JS-only was chosen (team familiarity? build simplicity?) so it's a conscious tradeoff, with Zod-at-every-boundary as the compensating control — which this blueprint already assumes throughout.
5. **Feature flags from day one** (`packages/config/src/flags.js`, backed by a simple DB-driven flag collection or a service like LaunchDarkly later) — useful for rolling out new Learning Block types, new simulations, or new curricula to a subset of schools before wide release, which matters a lot in a multi-school, multi-country rollout.

---

*End of blueprint. This document should live at `docs/architecture/newton-ai-architecture-blueprint.md` in the repo itself, and be updated via ADR whenever a boundary in §5 is intentionally crossed.*
