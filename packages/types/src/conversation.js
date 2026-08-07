// packages/types/src/conversation.js
//
// The single source of truth for the shape of data crossing trust boundaries.
// Gemini output is NEVER trusted until it passes tutorTurnSchema.parse().
// This is your compensating control for having no TypeScript (see blueprint §7.3).

import { z } from 'zod';

/**
 * Reveal levels for the Socratic ladder. Your CODE owns advancement of this,
 * not the model. The model only ever RECOMMENDS a change (see recommendAdvance).
 *
 * 0 = diagnose        - surface what the student already thinks, ask nothing leading
 * 1 = guide           - guiding questions, hints, analogies. No answer.
 * 2 = scaffold        - partial structure, fill-in-the-reasoning prompts
 * 3 = confirm/reveal  - only now may the full explanation be stated
 */
export const REVEAL_LEVELS = Object.freeze({
  DIAGNOSE: 0,
  GUIDE: 1,
  SCAFFOLD: 2,
  REVEAL: 3,
});

export const MAX_REVEAL_LEVEL = REVEAL_LEVELS.REVEAL;

// --- Learning blocks the AI may emit (blueprint §4.2) -----------------------
// Start with THREE block types for the MVP, not ten. Add more later by
// extending this union + adding a renderer. Nothing else changes.

const chatBlockSchema = z.object({
  type: z.literal('chat'),
  payload: z.object({
    text: z.string().min(1).max(4000),
  }),
});

const quizBlockSchema = z.object({
  type: z.literal('quiz'),
  payload: z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2).max(5),
    // index into options; used to score, never sent raw to the client
    correctIndex: z.number().int().nonnegative(),
  }),
});

const simulationBlockSchema = z.object({
  type: z.literal('simulation'),
  payload: z.object({
    // MUST match an id in packages/simulations/registry.js. Validated again
    // there against the sim's own paramSchema before render (blueprint §4.3).
    simulationId: z.string().min(1),
    params: z.record(z.unknown()), // sim-specific; registry validates precisely
    objectives: z.array(z.string()).default([]),
  }),
});

// Mirrors packages/database/src/models/Session.js SUBJECTS — duplicated
// rather than imported: packages/database already depends on packages/types,
// so the reverse import would create a circular package dependency (and
// would pull Mongoose into a package meant to be safely importable by `ui`
// and client code). Keep these four values in sync with that file.
const SUBJECT_VALUES = ['physics', 'chemistry', 'biology', 'maths'];

const subjectSwitchBlockSchema = z.object({
  type: z.literal('subjectSwitch'),
  payload: z.object({
    // MUST be one of the four real subjects — a model that names anything
    // else fails validation here, never reaches the client as a button.
    targetSubject: z.enum(SUBJECT_VALUES),
  }),
});

const formulaBlockSchema = z.object({
  type: z.literal('formula'),
  payload: z.object({
    // A LaTeX string, e.g. "F = ma" or "a = \\frac{F}{m}". Rendered via
    // KaTeX client-side (FormulaBlock.jsx) — malformed LaTeX degrades to
    // plain text there, never a crash, so no stricter validation is needed
    // here.
    latex: z.string().min(1).max(500),
    caption: z.string().max(200).optional(),
  }),
});

export const learningBlockSchema = z.discriminatedUnion('type', [
  chatBlockSchema,
  quizBlockSchema,
  simulationBlockSchema,
  subjectSwitchBlockSchema,
  formulaBlockSchema,
]);

// --- The full turn contract Gemini must satisfy -----------------------------

export const tutorTurnSchema = z.object({
  // What the student sees.
  blocks: z.array(learningBlockSchema).min(1),

  // The model's ASSESSMENT of the student this turn. Advisory only.
  // Your MasteryEngine decides what to do with it.
  assessment: z.object({
    understanding: z.enum(['none', 'partial', 'solid']),
    // model's recommendation — code may ignore or veto this
    recommendAdvance: z.boolean(),
    // one-line rationale, for logging + your adversarial test suite. Internal
    // only — never shown to the student — so an over-long value must never
    // crash the turn: truncate to the cap instead of rejecting.
    reason: z.string().transform((s) => s.slice(0, 300)),
    // did the student essentially ask us to just hand over the answer?
    // used as a hard guardrail input in MasteryEngine.
    studentRequestedAnswer: z.boolean(),
  }),

  // Advisory signal for whether/how THIS subject chat's concept has been
  // established or changed this turn. Same AI-suggests/code-decides pattern
  // as assessment — MasteryEngine.resolveConcept() decides whether to accept
  // it, never this schema or the model itself. Optional: PromptBuilder does
  // not ask the model for this yet, so existing turns without it stay valid.
  conceptUpdate: z
    .object({
      established: z.boolean(),
      title: z.string().min(1).nullable(),
      objective: z.string().min(1).nullable(),
    })
    .optional(),
});

/**
 * @typedef {z.infer<typeof tutorTurnSchema>} TutorTurn
 * @typedef {z.infer<typeof learningBlockSchema>} LearningBlock
 */
