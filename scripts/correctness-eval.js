// scripts/correctness-eval.js
//
// FACTUAL CORRECTNESS eval — separate concern from the adversarial suite
// (scripts/adversarial-socratic-suite.js). That suite checks pedagogical
// BEHAVIOR (advance/hold/veto/sim-fit). This eval checks whether the tutor
// ever STATES a wrong fact — wrong maths, wrong physics, wrong chemistry,
// wrong biology. A Socratically-perfect tutor that states a wrong fact
// still loses a teacher's trust instantly, so this is checked independently.
//
// WHY A PLAIN NODE SCRIPT, NOT JEST: same reasoning as the adversarial
// suite — @newton/jest-config is an empty placeholder and jest itself is
// not installed anywhere in this repo. This follows the same harness.
//
// HOW IT WORKS — LLM-as-judge, because free-text factual accuracy can't be
// checked with simple assertions:
//   1. For each problem (known correct answer), drive TWO real turns through
//      the REAL pipeline (buildPrompt -> streamTurn -> tutorTurnSchema):
//        - Turn 1 at a scaffold reveal level, with a cooperative student
//          message, to get the tutor engaging with real content.
//        - Turn 2 at CONFIRM & REVEAL (level 3), using turn 1's ACTUAL
//          response as history, with a student message asking for
//          confirmation — this is where the tutor states facts clearly.
//      (Not a full ladder climb from level 0 — that would need ~8 turns per
//      problem across 6 problems, too slow/expensive for an eval. Reveal
//      level is set directly on the input, same as several cases already do
//      in the adversarial suite. Turn 2 still reacts to turn 1's real,
//      live-generated text, so it's not fully scripted either.)
//   2. A SEPARATE Gemini call acts as judge: given the tutor's statements
//      from both turns + the known-correct answer, it returns structured
//      JSON { factuallyCorrect, errors }. The judge is scoped to factual
//      accuracy ONLY — explicitly told to ignore teaching style and
//      answer-timing.
//   3. Assert factuallyCorrect === true. On failure, print the tutor's
//      statements and the judge's stated errors.
//
// RATE LIMIT: 2 tutor turns + 1 judge call per problem, 6 problems = 18
// live Gemini calls. Calls are spaced 7s apart (free tier ~10 RPM). This is
// a slow integration run — expect ~3-4 minutes total, not a fast unit run.
//
// MODEL VARIANCE: a single wrong fact could be a one-off generation slip,
// not a systemic error. If a problem FAILS, re-run this script and see if
// it fails again before treating it as a confirmed regression — consistent
// failure across runs is a real finding; a single failure is worth
// watching, not yet proof of a systemic error.
//
// HOW TO RUN:
//   node scripts/correctness-eval.js
//
// Exit code 0 = every problem judged factually correct. Exit code 1 = at
// least one problem had a stated factual error — read the FAIL lines. Do
// NOT edit this eval to make a real error disappear; report it and fix the
// engine (PromptBuilder/etc.) in a separate task.

import '../packages/config/src/dotenv-loader.js';
import { buildPrompt } from '../packages/ai/src/orchestrator/PromptBuilder.js';
import { streamTurn } from '../packages/ai/src/providers/GeminiProvider.js';
import { tutorTurnSchema } from '../packages/types/src/conversation.js';
import { z } from 'zod';

const CALL_SPACING_MS = 7000; // stays under free-tier ~10 RPM

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJson(raw) {
  return raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '');
}

async function runTurn(input) {
  const prompt = buildPrompt(input);
  let raw = '';
  for await (const chunk of streamTurn(prompt)) raw += chunk;
  const parsed = tutorTurnSchema.parse(JSON.parse(cleanJson(raw)));
  return parsed;
}

function chatText(parsed) {
  return parsed.blocks
    .filter((b) => b.type === 'chat')
    .map((b) => b.payload.text)
    .join('\n');
}

// --- Judge -------------------------------------------------------------
// A separate, independently-validated call. Deliberately NOT the tutor
// pipeline or tutorTurnSchema — this is a different contract (a
// correctness verdict, not a learning block).

const judgeResultSchema = z.object({
  factuallyCorrect: z.boolean(),
  errors: z.array(z.string()),
});

function buildJudgePrompt({ knownCorrectAnswer, tutorStatements }) {
  const system = [
    'You are a strict fact-checker for a maths/physics/chemistry/biology tutoring transcript.',
    'You check ONLY factual/mathematical/scientific correctness of what the tutor stated.',
    'You do NOT judge teaching style, Socratic method, whether the tutor gave the answer too early or too late, tone, or pacing — ignore all of that entirely, even if it seems off.',
    'Return ONLY valid JSON: { "factuallyCorrect": boolean, "errors": string[] }. No markdown, no prose outside JSON.',
  ].join(' ');

  const user = [
    `KNOWN CORRECT ANSWER / REFERENCE FACTS:`,
    knownCorrectAnswer,
    ``,
    `TUTOR'S STATEMENTS (from a real tutoring conversation):`,
    tutorStatements,
    ``,
    `Did the tutor state anything mathematically or scientifically WRONG relative to the reference facts above? Consider only claims the tutor actually asserted as fact (not questions it asked the student, not hedged "maybe" framing aimed at prompting the student's own thinking). If a numeric value is given, it must match the reference (small rounding, e.g. 35.3 vs 35.36, is fine — a materially different number is not).`,
    `Return { "factuallyCorrect": true, "errors": [] } if everything stated was correct or the tutor stated no relevant fact yet. Return { "factuallyCorrect": false, "errors": ["..."] } listing each wrong statement in plain English if anything was wrong.`,
  ].join('\n');

  return { system, user };
}

async function judge(problem, tutorStatements) {
  const prompt = buildJudgePrompt({ knownCorrectAnswer: problem.knownCorrectAnswer, tutorStatements });
  let raw = '';
  for await (const chunk of streamTurn(prompt)) raw += chunk;
  return judgeResultSchema.parse(JSON.parse(cleanJson(raw)));
}

// --- Ground-truth cross-check for the projectile problem ---------------
// Recomputed directly here (not imported from packages/simulations) to
// avoid pulling the .jsx component tree into a plain-node script — same
// GRAVITY constant and formula ProjectileMotion.jsx uses.
function projectileRange(angleDeg, speed) {
  const GRAVITY = 9.8;
  const theta = (angleDeg * Math.PI) / 180;
  return (speed ** 2 * Math.sin(2 * theta)) / GRAVITY;
}

const projectileGroundTruthRange = projectileRange(30, 20);
const cliffFallTime = Math.sqrt((2 * 20) / 9.8);

// --- Problems ------------------------------------------------------------

const problems = [
  {
    name: 'Basic algebra: 2x + 5 = 15',
    subject: 'maths',
    concept: { title: 'Linear Equations', objective: 'Solve a simple linear equation for x' },
    knownCorrectAnswer: '2x + 5 = 15 solves to x = 5 (subtract 5 from both sides to get 2x = 10, then divide by 2).',
    turn1Message: 'I subtracted 5 from both sides and got 2x = 10.',
    turn2Message: "I think x = 5. Can you confirm and walk through the full solution?",
  },
  {
    name: 'Linear graph fact: slope/intercept of y = 2x + 3',
    subject: 'maths',
    concept: { title: 'Linear Graphs', objective: 'Identify slope and y-intercept from a linear equation' },
    knownCorrectAnswer: 'For y = 2x + 3, the slope (gradient) is 2 and the y-intercept is 3 (the line crosses the y-axis at (0, 3)).',
    turn1Message: 'I think the number in front of x tells you the steepness, so that might be the slope?',
    turn2Message: 'So for y = 2x + 3, is the slope 2 and the y-intercept 3? Can you confirm and explain fully?',
  },
  {
    name: 'Projectile motion range (ground launch, 30 degrees, 20 m/s)',
    subject: 'physics',
    concept: { title: 'Projectile Motion', objective: 'Compute the range of a ground-launched projectile' },
    knownCorrectAnswer: `A ball launched from the ground at 30 degrees at 20 m/s has range R = v^2 * sin(2*theta) / g = 20^2 * sin(60deg) / 9.8 ~= ${projectileGroundTruthRange.toFixed(2)} m (approximately 35.3 m). This matches the projectile-motion simulation's own computed value for these params, which is the ground truth here — flag any tutor value that materially contradicts ~${projectileGroundTruthRange.toFixed(1)} m.`,
    turn1Message: 'I think range depends on both the angle and the speed, and using sine of double the angle somehow?',
    turn2Message: 'So for a ball launched at 30 degrees at 20 m/s, is the range about 35 meters? Can you confirm and show the full working?',
  },
  {
    name: 'Cliff/fall-time: t = sqrt(2h/g) for a 20m cliff',
    subject: 'physics',
    concept: { title: 'Projectile Motion', objective: 'Compute time to fall from a launch height' },
    knownCorrectAnswer: `For an object thrown horizontally from a 20m height, vertical fall time is independent of horizontal speed: t = sqrt(2h/g) = sqrt(2*20/9.8) ~= ${cliffFallTime.toFixed(2)} s (approximately 2.02 s).`,
    turn1Message: "I think the horizontal speed doesn't matter for how long it takes to fall — only the height matters?",
    turn2Message: 'So for a 20 meter cliff, does it take about 2 seconds to hit the ground? Can you confirm and show the full working?',
  },
  {
    name: "Newton's second law: F = ma (m=2kg, a=5 m/s^2)",
    subject: 'physics',
    concept: { title: "Newton's Second Law", objective: 'Relate force, mass, and acceleration' },
    knownCorrectAnswer: 'Newtons second law: F = m * a. For a 2 kg mass accelerating at 5 m/s^2, F = 2 * 5 = 10 N.',
    turn1Message: 'I think force equals mass times acceleration, so bigger mass or bigger acceleration means more force?',
    turn2Message: 'So for a 2 kg object accelerating at 5 m/s^2, is the force 10 newtons? Can you confirm and explain fully?',
  },
  {
    name: 'Photosynthesis inputs/outputs',
    subject: 'biology',
    concept: { title: 'Photosynthesis', objective: 'Identify the inputs and outputs of photosynthesis' },
    knownCorrectAnswer: 'Photosynthesis inputs are carbon dioxide, water, and light energy (absorbed by chlorophyll); outputs are glucose and oxygen. Overall: 6CO2 + 6H2O + light -> C6H12O6 + 6O2.',
    turn1Message: 'I think plants take in carbon dioxide and water, and use sunlight somehow?',
    turn2Message: 'So do plants produce glucose and oxygen from that? Can you confirm and explain fully what goes in and what comes out?',
  },
];

async function runProblem(problem) {
  const turn1 = await runTurn({
    subject: problem.subject,
    concept: problem.concept,
    revealLevel: 2, // SCAFFOLD — engage with real content, not just diagnose
    exchangesAtLevel: 2,
    history: [],
    runningSummary: '',
    studentMessage: problem.turn1Message,
  });

  await sleep(CALL_SPACING_MS);

  const turn2 = await runTurn({
    subject: problem.subject,
    concept: problem.concept,
    revealLevel: 3, // CONFIRM & REVEAL — state the explanation clearly
    exchangesAtLevel: 2,
    history: [
      { role: 'student', text: problem.turn1Message },
      { role: 'tutor', text: chatText(turn1) },
    ],
    runningSummary: '',
    studentMessage: problem.turn2Message,
  });

  const tutorStatements = [chatText(turn1), chatText(turn2)].filter(Boolean).join('\n---\n');

  await sleep(CALL_SPACING_MS);

  const verdict = await judge(problem, tutorStatements);

  return { tutorStatements, verdict };
}

async function main() {
  const results = [];

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    process.stdout.write(`\nRunning: ${problem.name}\n`);
    try {
      const { tutorStatements, verdict } = await runProblem(problem);
      if (verdict.factuallyCorrect) {
        console.log('  PASS');
        results.push({ name: problem.name, pass: true });
      } else {
        console.log('  FAIL — factual error(s) found:');
        for (const err of verdict.errors) console.log(`    - ${err}`);
        console.log('  Tutor statements that produced this verdict:');
        console.log('    ' + tutorStatements.replace(/\n/g, '\n    '));
        results.push({ name: problem.name, pass: false, errors: verdict.errors, tutorStatements });
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results.push({ name: problem.name, pass: false, errors: [`threw: ${err.message}`] });
    }

    if (i < problems.length - 1) await sleep(CALL_SPACING_MS);
  }

  console.log('\n=== SUMMARY ===');
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}`);
  const failCount = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failCount}/${results.length} passed.`);
  if (failCount > 0) {
    console.log('\nA FAIL is a real finding. Re-run this script before treating it as confirmed —');
    console.log('model output varies, so a single wrong statement could be a one-off slip. Consistent');
    console.log('failure across re-runs is a real regression; do not edit this eval to hide it.');
  }
  process.exit(failCount > 0 ? 1 : 0);
}

main();
