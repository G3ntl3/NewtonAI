// apps/student-web/src/app/api/chat/route.js
//
// THIN route handler (blueprint §4.4): authenticate, delegate, stream back.
// No prompt logic, no Gemini import, no pedagogy here — all of that lives in
// packages/ai. This file only wires HTTP <-> orchestrator.
//
// Streams the model output to the client as it arrives (dodges the Vercel
// Hobby 10s timeout), then does the state update after the stream closes.

import { streamTurn } from '@newton/ai/src/providers/GeminiProvider.js';
import { buildPrompt } from '@newton/ai/src/orchestrator/PromptBuilder.js';
import { decideRevealLevel, resolveConcept } from '@newton/ai/src/orchestrator/MasteryEngine.js';
import { tutorTurnSchema } from '@newton/types/src/conversation.js';
import { getOrCreateSession, saveSession } from '@newton/database/src/repositories/sessionRepo.js';
import { SUBJECTS } from '@newton/database/src/models/Session.js';
import { requireStudent } from '@newton/auth/src/session.js';

export const runtime = 'nodejs'; // Mongoose needs Node, not Edge

export async function POST(req) {
  // 1. AUTH — enforce ownership. A student may only touch their own session.
  let student;
  try {
    student = await requireStudent(req);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, message } = await req.json();
  if (!message?.trim()) {
    return Response.json({ error: 'Empty message' }, { status: 400 });
  }
  if (!Object.values(SUBJECTS).includes(subject)) {
    return Response.json({ error: 'Invalid or missing subject' }, { status: 400 });
  }

  // 2. LOAD STATE — one chat per (student, subject); reveal level lives
  // here, in the DB, owned by our code.
  const session = await getOrCreateSession(student.id, subject);
  if (!session) {
    return Response.json({ error: 'Could not start session' }, { status: 500 });
  }

  // 3. BUILD the leveled prompt (history truncation handled inside).
  //    session.concept === null selects PromptBuilder's discovery mode,
  //    which needs subject; tutoring mode ignores it.
  const prompt = buildPrompt({
    revealLevel: session.revealLevel,
    concept: session.concept,
    subject: session.subject,
    history: session.history,
    runningSummary: session.runningSummary,
    studentMessage: message,
  });

  // 4. STREAM back to the client while accumulating the full JSON.
  const encoder = new TextEncoder();
  let raw = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamTurn(prompt)) {
          raw += chunk;
          controller.enqueue(encoder.encode(chunk)); // live to the UI
        }
      } catch (err) {
        // Logged server-side (shows in the terminal running `next dev`) —
        // the student only ever sees the friendly message below, never this.
        console.error('[POST /api/chat] streamTurn failed:', err.message, '| rateLimited:', err.rateLimited, '| cause:', err.cause?.message ?? err.cause);
        const friendly = err.rateLimited
          ? "A lot of students are asking questions right now — give me a few seconds and try again."
          : "Something went wrong on my end. Try sending that again.";
        controller.enqueue(encoder.encode(JSON.stringify({ error: friendly })));
        controller.close();
        return;
      }
      // 5. VALIDATE the assembled output at the trust boundary. Never trust
      //    Gemini's shape — Zod is the compensating control for no TypeScript.
      let turn;
      try {
        turn = tutorTurnSchema.parse(JSON.parse(raw));
      } catch (err) {
        // Logged server-side only — the client independently re-parses this
        // same raw text and fails the same way, surfacing as the generic
        // "Something went wrong" message with no indication of why.
        console.error('[POST /api/chat] malformed AI output, turn discarded:', err.message, '| raw:', raw.slice(0, 500));
        // Malformed AI output: don't corrupt state, don't advance the ladder.
        controller.close();
        return;
      }

      // 6. CODE decides the reveal level from the model's advisory assessment.
      //    A newly established/changed concept resets the ladder instead —
      //    same AI-suggests/code-decides pattern (CLAUDE.md "Session &
      //    concept model"). resolveConcept() is where that's decided; not
      //    reimplemented here.
      const { concept, conceptChanged } = resolveConcept(session, turn.conceptUpdate);
      const decision = conceptChanged
        ? {
            nextLevel: 0,
            exchangesAtLevel: 0,
            note: `concept ${session.concept ? 'changed' : 'established'}: "${concept.title}"`,
          }
        : decideRevealLevel(session, turn.assessment);

      // 7. PERSIST. Append turn, update level + counters. (MemoryManager would
      //    also refresh runningSummary here once history exceeds the window.)
      await saveSession(session.sessionId, student.id, {
        concept,
        revealLevel: decision.nextLevel,
        exchangesAtLevel: decision.exchangesAtLevel,
        history: [
          ...session.history,
          { role: 'student', text: message },
          {
            role: 'tutor',
            text: extractTutorText(turn),
            // Full block array (chat + any simulation/quiz/subjectSwitch
            // blocks) so a page refresh can rehydrate exactly what the
            // student saw, not just the chat text — see conversationStore's
            // setHistory. Already validated by tutorTurnSchema.parse() above.
            blocks: turn.blocks,
            // Persisted for audit only — already consumed above, nothing
            // here feeds back into revealLevel/exchangesAtLevel/concept.
            assessment: turn.assessment,
            conceptUpdate: turn.conceptUpdate,
            decisionNote: decision.note,
          },
        ],
        lastDecisionNote: decision.note, // useful for your adversarial tests
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function extractTutorText(turn) {
  const chat = turn.blocks.find((b) => b.type === 'chat');
  return chat?.payload.text ?? '[interactive block]';
}
