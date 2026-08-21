import ErrorEvent from '../models/ErrorEvent.js';

/**
 * Writes are FIRE-AND-FORGET by contract: observability must never be able to
 * break a lesson turn, so every call swallows its own failure. Callers do not
 * need their own try/catch.
 */
export const ErrorEventRepository = {
  /** Record one chat request outcome. Never throws. */
  async record(event) {
    try {
      await ErrorEvent.create({
        timestamp: new Date(),
        ...event,
        // Cap the raw upstream message — some SDK errors embed a whole URL
        // plus payload and would bloat the collection.
        cause: event.cause ? String(event.cause).slice(0, 500) : null,
      });
    } catch {
      // Intentionally silent: a failed observability write must not surface.
    }
  },

  /** Failures in a window, newest first — the recent-errors table. */
  async recentFailures(since, limit = 25) {
    return ErrorEvent.find({ ok: false, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();
  },
};

export default ErrorEventRepository;
