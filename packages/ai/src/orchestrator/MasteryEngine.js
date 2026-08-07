// packages/ai/src/orchestrator/MasteryEngine.js
//
// THE PEDAGOGICAL GATE. This is the file that makes Newton "Newton".
//
// Decision model: AI-SUGGESTED, CODE-APPROVED.
//   - Gemini assesses understanding and RECOMMENDS advancing the reveal level.
//   - This code DECIDES, applying guardrails the model cannot override.
//
// The reveal level lives in MongoDB, not the conversation. A student pleading
// "just give me the answer" cannot move it, because the model was only ever
// TOLD the current level — it never controls it. That's the moat.

import { MAX_REVEAL_LEVEL } from '../../../types/src/conversation.js';

// Guardrails — deliberately conservative. Tune with your adversarial test suite.
const MIN_EXCHANGES_PER_LEVEL = 2; // must engage at a level before advancing
const MAX_ADVANCE_PER_TURN = 1;    // never skip a rung of the ladder

/**
 * Decide the next reveal level given current state + the model's assessment.
 *
 * @param {Object} state - persisted session state from Mongo
 * @param {number} state.revealLevel
 * @param {number} state.exchangesAtLevel
 * @param {Object} assessment - validated model output (advisory)
 * @param {'none'|'partial'|'solid'} assessment.understanding
 * @param {boolean} assessment.recommendAdvance
 * @param {boolean} assessment.studentRequestedAnswer
 * @returns {{ nextLevel: number, advanced: boolean, exchangesAtLevel: number, note: string }}
 */
export function decideRevealLevel(state, assessment) {
  const current = clampLevel(state.revealLevel ?? 0);
  const exchanges = (state.exchangesAtLevel ?? 0) + 1; // this turn counts

  // HARD VETO 1: a bare request for the answer never advances the ladder,
  // no matter what the model recommends. This is the "just tell me" defense.
  if (assessment.studentRequestedAnswer) {
    return stay(current, exchanges, 'veto: student requested answer outright');
  }

  // HARD VETO 2: minimum engagement not yet met at this level.
  if (exchanges < MIN_EXCHANGES_PER_LEVEL) {
    return stay(current, exchanges, `veto: only ${exchanges} exchange(s) at level`);
  }

  // HARD VETO 3: model didn't recommend advancing, or sees no understanding.
  if (!assessment.recommendAdvance || assessment.understanding === 'none') {
    return stay(current, exchanges, 'hold: model did not recommend advance');
  }

  // Passed the gates: advance at most one rung, capped at REVEAL.
  const nextLevel = clampLevel(current + MAX_ADVANCE_PER_TURN);
  if (nextLevel === current) {
    return stay(current, exchanges, 'hold: already at max reveal level');
  }

  // Advanced — reset the per-level exchange counter.
  return {
    nextLevel,
    advanced: true,
    exchangesAtLevel: 0,
    note: `advance ${current}->${nextLevel} (understanding=${assessment.understanding})`,
  };
}

/**
 * Resolves this turn's concept from the model's advisory conceptUpdate
 * signal (see CLAUDE.md "Session & concept model"). AI-SUGGESTED,
 * CODE-APPROVED — same pattern as decideRevealLevel: the model can only
 * propose that a concept has been named or changed; this function decides
 * whether to accept it. Does NOT call or alter decideRevealLevel — the
 * caller resets revealLevel/exchangesAtLevel to 0 when conceptChanged is
 * true, keeping the existing reveal-advancement guardrails completely
 * untouched.
 *
 * @param {Object} state - persisted session state from Mongo
 * @param {Object|null} state.concept - current { title, objective } | null
 * @param {Object} [conceptUpdate] - validated, advisory model output
 * @param {boolean} conceptUpdate.established
 * @param {string|null} conceptUpdate.title
 * @param {string|null} conceptUpdate.objective
 * @returns {{ concept: {title: string, objective: string}|null, conceptChanged: boolean }}
 */
export function resolveConcept(state, conceptUpdate) {
  const current = state.concept ?? null;

  // No signal, or the model isn't claiming a concept was established —
  // nothing to accept. Advisory only; code still decides (there's nothing
  // to decide here but "no").
  if (!conceptUpdate || !conceptUpdate.established || !conceptUpdate.title) {
    return { concept: current, conceptChanged: false };
  }

  // Same title as what's already recorded — not new, not a change.
  if (current && current.title === conceptUpdate.title) {
    return { concept: current, conceptChanged: false };
  }

  // Newly established, or changed to a different title — reset territory.
  return {
    concept: { title: conceptUpdate.title, objective: conceptUpdate.objective ?? '' },
    conceptChanged: true,
  };
}

function stay(level, exchanges, note) {
  return { nextLevel: level, advanced: false, exchangesAtLevel: exchanges, note };
}

function clampLevel(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(MAX_REVEAL_LEVEL, Math.floor(n)));
}
