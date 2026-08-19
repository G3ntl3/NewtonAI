/**
 * Student activity streak — PURE rules, no database access, so every
 * date-math edge case (same day, next day, gap, first ever) is unit-testable
 * without a connection.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TIMEZONE ASSUMPTION — WAT (UTC+1), HARDCODED FOR EVERY STUDENT
 * ─────────────────────────────────────────────────────────────────────────
 * "Today" is the West Africa Time calendar date, NOT the student's device
 * timezone and NOT the server's. Newton's pilot audience is Nigerian
 * secondary students, so one fixed offset is both correct for them and far
 * simpler than storing a timezone per user. WAT observes no daylight saving,
 * so a constant +1 is right year-round.
 *
 * THIS IS THE ONLY PLACE TO CHANGE if per-user timezones are ever needed —
 * grep for WAT_OFFSET_MINUTES.
 */
export const WAT_OFFSET_MINUTES = 60;

const MS_PER_DAY = 86_400_000;

/**
 * The WAT calendar date of an instant, as a date-only 'YYYY-MM-DD' key.
 * A plain string (not a Date) is deliberate: a Date is always a timestamp,
 * which reintroduces the very time-of-day ambiguity this is meant to remove.
 * String keys compare with `===` and sort correctly.
 *
 * @param {Date} [instant] defaults to now
 * @returns {string} e.g. '2026-08-08'
 */
export function watDateKey(instant = new Date()) {
  return new Date(instant.getTime() + WAT_OFFSET_MINUTES * 60_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * The WAT calendar day of an instant, as a Date pinned to UTC midnight.
 * StudySession.date uses this so a day's minutes accumulate into exactly one
 * row (its unique index is on userId+date), and so the weekly chart buckets
 * by the SAME day boundary the streak uses. Storing raw local midnight would
 * put the chart and the streak on different days either side of midnight.
 */
export function watDayStart(instant = new Date()) {
  return new Date(`${watDateKey(instant)}T00:00:00.000Z`);
}

/**
 * Minutes of study to credit for one chat turn.
 *
 * There is no session heartbeat, so elapsed time is inferred from the gap
 * since the student's previous turn. That gap is CLAMPED at both ends:
 *   · a floor, so a single message still earns credit for the thinking and
 *     reading around it (a turn is never worth zero);
 *   · a ceiling, so walking away mid-chat — or resuming the next morning —
 *     cannot book hours of "study" that never happened. This ceiling is the
 *     whole reason the value is trustworthy.
 *
 * @param {Date|string|number|null} previousActivityAt last turn, or null for a new session
 * @param {Date} [now]
 * @returns {number} minutes, always between MIN_TURN_MINUTES and MAX_GAP_MINUTES
 */
export const MIN_TURN_MINUTES = 1;
export const MAX_GAP_MINUTES = 10;

export function studyMinutesForTurn(previousActivityAt, now = new Date()) {
  const prev = previousActivityAt ? new Date(previousActivityAt).getTime() : NaN;
  const elapsedMs = now.getTime() - prev;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return MIN_TURN_MINUTES;
  const minutes = elapsedMs / 60_000;
  return Math.min(MAX_GAP_MINUTES, Math.max(MIN_TURN_MINUTES, Math.round(minutes)));
}

/** Whole days from one 'YYYY-MM-DD' key to another. Negative if toKey is earlier. */
export function daysBetweenDateKeys(fromKey, toKey) {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * Apply one day's activity to a student's streak state.
 *
 * Rules:
 *   - never active before      -> currentStreak = 1
 *   - last active TODAY        -> unchanged (multiple messages don't stack)
 *   - last active YESTERDAY    -> currentStreak + 1
 *   - last active 2+ days ago  -> reset to 1 (today is day one of a new run)
 *
 * longestStreak is the high-water mark and never decreases.
 *
 * @param {{currentStreak?: number, longestStreak?: number, lastActiveDate?: string|null}} state
 * @param {string} todayKey 'YYYY-MM-DD' in WAT — see watDateKey()
 * @returns {{currentStreak: number, longestStreak: number, lastActiveDate: string, changed: boolean}}
 *   `changed` is false when nothing needs writing, so callers can skip the update.
 */
export function nextStreakState(state, todayKey) {
  const currentStreak = state?.currentStreak ?? 0;
  const longestStreak = state?.longestStreak ?? 0;
  const lastActiveDate = state?.lastActiveDate ?? null;

  // First ever activity — or a record predating this feature.
  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      lastActiveDate: todayKey,
      changed: true,
    };
  }

  const gap = daysBetweenDateKeys(lastActiveDate, todayKey);

  // gap === 0: already counted today. gap < 0 only happens on clock skew or a
  // backfilled older event — treat both as "nothing to do" rather than
  // corrupting a valid streak.
  if (gap <= 0) {
    return { currentStreak, longestStreak, lastActiveDate, changed: false };
  }

  if (gap === 1) {
    const next = currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(longestStreak, next),
      lastActiveDate: todayKey,
      changed: true,
    };
  }

  // gap >= 2 — the run is broken; today starts a new one.
  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    lastActiveDate: todayKey,
    changed: true,
  };
}
