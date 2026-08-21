import { connect } from '@newton/database/src/connection.js';
import User from '@newton/database/src/models/User.js';
import Session from '@newton/database/src/models/Session.js';
import ErrorEvent from '@newton/database/src/models/ErrorEvent.js';
import { watDateKey } from '@newton/database/src/streak.js';

/**
 * Admin monitoring aggregations.
 *
 * Everything here runs as a MongoDB aggregation pipeline — no loading
 * documents and reducing in JS. Turn-level metrics $unwind `history`, which
 * already persists `assessment`, `conceptUpdate`, `decisionNote` and `blocks`
 * per tutor turn, so no new tutoring-side schema was needed.
 *
 * KNOWN APPROXIMATIONS, stated rather than hidden:
 *  · History entries carry NO per-turn timestamp. Turn-level windows are
 *    therefore filtered by the SESSION's updatedAt, so a 7d window means
 *    "turns belonging to sessions touched in the last 7 days", not "turns
 *    that happened in the last 7 days".
 *  · Per-turn reveal level is not stored either. `turnsByRevealLevel` groups
 *    turns by their session's CURRENT level. It is a shape indicator, not an
 *    exact history.
 *  · The veto rate is read from `decisionNote`, which is written by
 *    MasteryEngine and begins "hold:" when a level change was declined.
 */

const DAY_MS = 86_400_000;

/** Window start for a range key. `all` returns the epoch. */
function since(range) {
  const now = Date.now();
  if (range === 'today') return new Date(new Date().setHours(0, 0, 0, 0));
  if (range === '30d') return new Date(now - 30 * DAY_MS);
  if (range === 'all') return new Date(0);
  return new Date(now - 7 * DAY_MS); // default 7d
}

/** Turn-level facets, shared by every metric that $unwinds history. */
function turnPipeline(from) {
  return [
    { $match: { updatedAt: { $gte: from } } },
    { $unwind: '$history' },
    { $match: { 'history.role': 'tutor' } },
  ];
}

export async function getAdminSummary({ range = '7d' } = {}) {
  await connect();

  const from = since(range);
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const dayAgo = new Date(Date.now() - DAY_MS);
  const todayKey = watDateKey();
  const weekKeys = Array.from({ length: 7 }, (_, i) =>
    watDateKey(new Date(Date.now() - i * DAY_MS))
  );

  const [
    userCounts,
    streakBuckets,
    sessionTotals,
    perSubject,
    topConcepts,
    turnsPerSession,
    understanding,
    advanceStats,
    mistakeTypes,
    mistakeBySubject,
    signals,
    turnsByLevel,
    stuckSessions,
    errorTotals,
    errorsByCause,
    latency,
    recentErrors,
  ] = await Promise.all([
    // ── Usage: registrations + active ────────────────────────────────
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          newToday: { $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, 1, 0] } },
          new7d: { $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, 1, 0] } },
          activeToday: { $sum: { $cond: [{ $eq: ['$lastActiveDate', todayKey] }, 1, 0] } },
          active7d: { $sum: { $cond: [{ $in: ['$lastActiveDate', weekKeys] }, 1, 0] } },
        },
      },
    ]),

    // Streak distribution — bucketed in the pipeline, not in JS.
    User.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: [{ $ifNull: ['$currentStreak', 0] }, 0] }, then: '0' },
                { case: { $lte: ['$currentStreak', 3] }, then: '1-3' },
                { case: { $lte: ['$currentStreak', 7] }, then: '4-7' },
              ],
              default: '8+',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Usage: sessions ──────────────────────────────────────────────
    Session.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          inWindow: { $sum: { $cond: [{ $gte: ['$updatedAt', from] }, 1, 0] } },
          todayCount: { $sum: { $cond: [{ $gte: ['$updatedAt', todayStart] }, 1, 0] } },
          // Discovery mode: a session that has never had a concept established.
          noConceptEver: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$concept', null] }, null] }, 1, 0] } },
          turnsToday: {
            $sum: {
              $cond: [
                { $gte: ['$updatedAt', todayStart] },
                { $size: { $ifNull: ['$history', []] } },
                0,
              ],
            },
          },
        },
      },
    ]),

    Session.aggregate([
      { $group: { _id: '$subject', sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
    ]),

    Session.aggregate([
      { $match: { 'concept.title': { $ne: null } } },
      { $group: { _id: '$concept.title', sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
      { $limit: 10 },
    ]),

    // Turns per session — median comes from $percentile, computed server-side.
    Session.aggregate([
      { $project: { turns: { $size: { $ifNull: ['$history', []] } } } },
      {
        $group: {
          _id: null,
          median: { $percentile: { input: '$turns', p: [0.5], method: 'approximate' } },
          p90: { $percentile: { input: '$turns', p: [0.9], method: 'approximate' } },
          mean: { $avg: '$turns' },
          max: { $max: '$turns' },
        },
      },
    ]),

    // ── Tutor quality ────────────────────────────────────────────────
    Session.aggregate([
      ...turnPipeline(from),
      { $group: { _id: '$history.assessment.understanding', count: { $sum: 1 } } },
    ]),

    // recommendAdvance rate, and how often the engine declined it.
    Session.aggregate([
      ...turnPipeline(from),
      {
        $group: {
          _id: null,
          turns: { $sum: 1 },
          recommended: { $sum: { $cond: ['$history.assessment.recommendAdvance', 1, 0] } },
          requestedAnswer: {
            $sum: { $cond: ['$history.assessment.studentRequestedAnswer', 1, 0] },
          },
          // decisionNote starts "hold:" when MasteryEngine refused the advance.
          vetoed: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$history.assessment.recommendAdvance',
                    { $regexMatch: { input: { $ifNull: ['$history.decisionNote', ''] }, regex: /^hold/i } },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    Session.aggregate([
      ...turnPipeline(from),
      { $group: { _id: { $ifNull: ['$history.assessment.mistakeType', 'unset'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Session.aggregate([
      ...turnPipeline(from),
      { $match: { 'history.assessment.mistakeType': { $nin: [null, 'none'] } } },
      {
        $group: {
          _id: { subject: '$subject', mistakeType: '$history.assessment.mistakeType' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // conceptUpdate + subjectSwitch frequency — a spike is an early warning
    // of the misclassification bugs that were previously found by hand.
    Session.aggregate([
      ...turnPipeline(from),
      {
        $group: {
          _id: null,
          turns: { $sum: 1 },
          conceptUpdates: {
            $sum: { $cond: [{ $eq: ['$history.conceptUpdate.established', true] }, 1, 0] },
          },
          subjectSwitches: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ['$history.blocks', []] },
                          as: 'b',
                          cond: { $eq: ['$$b.type', 'subjectSwitch'] },
                        },
                      },
                    },
                    0,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Approximation — see header note.
    Session.aggregate([
      ...turnPipeline(from),
      { $group: { _id: '$revealLevel', turns: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // ── THE DRIFT DETECTOR: still at level 0 after 6+ turns ───────────
    Session.aggregate([
      {
        $project: {
          sessionId: 1,
          userId: 1,
          subject: 1,
          revealLevel: 1,
          updatedAt: 1,
          concept: 1,
          turns: { $size: { $ifNull: ['$history', []] } },
        },
      },
      { $match: { revealLevel: 0, turns: { $gte: 6 } } },
      { $sort: { turns: -1 } },
      { $limit: 25 },
    ]),

    // ── Reliability ──────────────────────────────────────────────────
    ErrorEvent.aggregate([
      { $match: { timestamp: { $gte: dayAgo } } },
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          failures: { $sum: { $cond: ['$ok', 0, 1] } },
          retryExhausted: { $sum: { $cond: [{ $gte: ['$retryCount', 1] }, 1, 0] } },
          rateLimited: { $sum: { $cond: ['$rateLimited', 1, 0] } },
        },
      },
    ]),

    ErrorEvent.aggregate([
      { $match: { ok: false, timestamp: { $gte: dayAgo } } },
      { $group: { _id: '$errorCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    ErrorEvent.aggregate([
      { $match: { ok: true, timestamp: { $gte: from }, totalMs: { $ne: null } } },
      {
        $group: {
          _id: null,
          samples: { $sum: 1 },
          ttftMedian: { $percentile: { input: '$ttftMs', p: [0.5], method: 'approximate' } },
          totalMedian: { $percentile: { input: '$totalMs', p: [0.5], method: 'approximate' } },
          totalP90: { $percentile: { input: '$totalMs', p: [0.9], method: 'approximate' } },
        },
      },
    ]),

    ErrorEvent.find({ ok: false, timestamp: { $gte: dayAgo } })
      .sort({ timestamp: -1 })
      .limit(25)
      .lean()
      .exec(),
  ]);

  const u = userCounts[0] ?? {};
  const s = sessionTotals[0] ?? {};
  const adv = advanceStats[0] ?? {};
  const sig = signals[0] ?? {};
  const err = errorTotals[0] ?? {};
  const lat = latency[0] ?? {};
  const tps = turnsPerSession[0] ?? {};
  const pct = (v) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

  return {
    range,
    generatedAt: new Date().toISOString(),

    usage: {
      totalUsers: u.total ?? 0,
      newToday: u.newToday ?? 0,
      new7d: u.new7d ?? 0,
      activeToday: u.activeToday ?? 0,
      active7d: u.active7d ?? 0,
      streakBuckets: Object.fromEntries(streakBuckets.map((b) => [b._id, b.count])),
      totalSessions: s.total ?? 0,
      sessionsInWindow: s.inWindow ?? 0,
      sessionsToday: s.todayCount ?? 0,
      turnsToday: s.turnsToday ?? 0,
      sessionsWithoutConcept: s.noConceptEver ?? 0,
      perSubject: perSubject.map((x) => ({ subject: x._id, sessions: x.sessions })),
      topConcepts: topConcepts.map((x) => ({ concept: x._id, sessions: x.sessions })),
      turnsPerSession: {
        median: pct(tps.median),
        p90: pct(tps.p90),
        mean: tps.mean ? Math.round(tps.mean * 10) / 10 : 0,
        max: tps.max ?? 0,
      },
    },

    quality: {
      understanding: Object.fromEntries(
        understanding.map((x) => [x._id ?? 'unset', x.count])
      ),
      turns: adv.turns ?? 0,
      recommendAdvance: adv.recommended ?? 0,
      recommendAdvanceRate: adv.turns ? +((adv.recommended / adv.turns) * 100).toFixed(1) : 0,
      vetoed: adv.vetoed ?? 0,
      vetoRate: adv.recommended ? +((adv.vetoed / adv.recommended) * 100).toFixed(1) : 0,
      studentRequestedAnswer: adv.requestedAnswer ?? 0,
      studentRequestedAnswerRate: adv.turns
        ? +((adv.requestedAnswer / adv.turns) * 100).toFixed(1)
        : 0,
      mistakeTypes: Object.fromEntries(mistakeTypes.map((x) => [x._id, x.count])),
      mistakeBySubject: mistakeBySubject.map((x) => ({
        subject: x._id.subject,
        mistakeType: x._id.mistakeType,
        count: x.count,
      })),
      conceptUpdates: sig.conceptUpdates ?? 0,
      subjectSwitches: sig.subjectSwitches ?? 0,
      turnsByRevealLevel: Object.fromEntries(turnsByLevel.map((x) => [x._id ?? 0, x.turns])),
      stuckAtLevelZero: stuckSessions.map((x) => ({
        sessionId: x.sessionId,
        userId: String(x.userId),
        subject: x.subject,
        concept: x.concept?.title ?? null,
        turns: x.turns,
        updatedAt: x.updatedAt,
      })),
    },

    reliability: {
      requests24h: err.requests ?? 0,
      errors24h: err.failures ?? 0,
      errorRate24h: err.requests ? +((err.failures / err.requests) * 100).toFixed(1) : 0,
      retryExhausted24h: err.retryExhausted ?? 0,
      rateLimited24h: err.rateLimited ?? 0,
      byCause: Object.fromEntries(errorsByCause.map((x) => [x._id ?? 'UNKNOWN', x.count])),
      latency: {
        samples: lat.samples ?? 0,
        ttftMedianMs: pct(lat.ttftMedian),
        totalMedianMs: pct(lat.totalMedian),
        totalP90Ms: pct(lat.totalP90),
      },
      recent: recentErrors.map((e) => ({
        timestamp: e.timestamp,
        route: e.route,
        errorCode: e.errorCode,
        cause: e.cause,
        rateLimited: e.rateLimited,
        retryCount: e.retryCount,
        totalMs: e.totalMs,
      })),
    },
  };
}

export default getAdminSummary;
