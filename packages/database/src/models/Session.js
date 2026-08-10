import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

// See CLAUDE.md "Session & concept model" — one chat per (student, subject).
export const SUBJECTS = Object.freeze({
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  BIOLOGY: 'biology',
  MATHS: 'maths',
});

const conceptSchema = new Schema(
  {
    title: { type: String, trim: true, default: null },
    objective: { type: String, trim: true, default: null },
  },
  { _id: false }
);

// Mirrors tutorTurnSchema.assessment / .conceptUpdate in
// packages/types/src/conversation.js. Persisted per-turn (audit only —
// decideRevealLevel/resolveConcept already consumed these before this is
// written; nothing here feeds back into a decision).
const assessmentSchema = new Schema(
  {
    understanding: { type: String, enum: ['none', 'partial', 'solid'], required: true },
    recommendAdvance: { type: Boolean, required: true },
    reason: { type: String, required: true },
    studentRequestedAnswer: { type: Boolean, required: true },
    // Optional, mirroring the optional mistakeType in tutorTurnSchema.
    // Deliberately not `required`: turns written before this field existed,
    // and any turn where the model omits it, must stay valid.
    mistakeType: {
      type: String,
      enum: ['none', 'conceptual', 'procedural', 'calculation', 'misreading', 'guessing'],
    },
  },
  { _id: false }
);

const conceptUpdateSchema = new Schema(
  {
    established: { type: Boolean, required: true },
    title: { type: String, default: null },
    objective: { type: String, default: null },
  },
  { _id: false }
);

/**
 * A single Socratic tutoring session, one per (userId, subject). `revealLevel`
 * is the pedagogical gate — only MasteryEngine.decideRevealLevel() may change
 * it (see CLAUDE.md "The Socratic session"). `concept` starts null (a fresh
 * subject chat has nothing to teach yet); MasteryEngine.resolveConcept() is
 * the only place it's established or changed, resetting the reveal ladder
 * when it does (CLAUDE.md "Session & concept model"). Everything else here is
 * conversation state the orchestrator reads/writes each turn.
 */
const sessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: Object.values(SUBJECTS), required: true },
    concept: { type: conceptSchema, default: null },
    // 0..3, mirrors REVEAL_LEVELS in @newton/types/src/conversation.js
    revealLevel: { type: Number, default: 0, min: 0, max: 3 },
    exchangesAtLevel: { type: Number, default: 0, min: 0 },
    history: [
      {
        role: { type: String, enum: ['student', 'tutor'], required: true },
        text: { type: String, required: true },
        // Only ever set on role: 'tutor' entries — student turns never carry
        // these. Audit trail for why the ladder did/didn't move this turn;
        // see lastDecisionNote below for the (still-kept) single-value form.
        assessment: assessmentSchema,
        conceptUpdate: conceptUpdateSchema,
        decisionNote: String,
        // Full learning-block array for this turn (chat + any simulation/
        // quiz/subjectSwitch blocks), already validated upstream by
        // tutorTurnSchema.parse() before it ever reaches here — Mixed
        // because block shape is a discriminated union owned by
        // packages/types, not re-modeled in Mongoose. Only set on role:
        // 'tutor' entries. Older entries saved before this field existed
        // won't have it — the client falls back to reconstructing a
        // chat-only block from `text` in that case.
        blocks: [Schema.Types.Mixed],
      },
    ],
    runningSummary: { type: String, default: '' },
    // Single most-recent decision note — kept for existing readers. Each
    // history entry above now also carries its own decisionNote, so this
    // is no longer the only record.
    lastDecisionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// One chat per subject per student — enforced by the index, not just code.
sessionSchema.index({ userId: 1, subject: 1 }, { unique: true });

const Session = models.Session || model('Session', sessionSchema);
export default Session;
