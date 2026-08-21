import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Reliability log for AI chat requests — the record that did not exist when
 * "Failed to parse stream", 404 model names, 503 overloads and DNS drops were
 * being diagnosed by hand from terminal scrollback.
 *
 * SCOPE NOTE: named ErrorEvent, but one row is written per chat request,
 * successful or not, because latency has to be measured on the requests that
 * WORK — a latency figure drawn only from failures is meaningless. `ok`
 * separates the two: `ok: true` rows carry timing only, `ok: false` rows
 * carry the failure detail as well. Keeping both in one collection avoids a
 * second near-identical model.
 *
 * Deliberately NOT tutoring-side state: nothing here feeds the reveal ladder,
 * the concept, or any assessment. It is observability only, written on a path
 * that can never fail a lesson turn.
 */
const errorEventSchema = new Schema(
  {
    // Indexed: every dashboard query is a time window (today / 7d / 30d).
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    route: { type: String, required: true, trim: true },
    ok: { type: Boolean, required: true, default: false },

    // --- failure detail (null on ok rows) ------------------------------
    /** Normalised class: RATE_LIMITED | AI_ERROR | MALFORMED_OUTPUT | STREAM_PARSE | UPSTREAM_404 | UPSTREAM_503 | NETWORK */
    errorCode: { type: String, default: null },
    /** Raw upstream message, truncated — for eyeballing in the recent-errors table. */
    cause: { type: String, default: null },
    rateLimited: { type: Boolean, default: false },
    retryCount: { type: Number, default: 0, min: 0 },
    resolvedAfterRetry: { type: Boolean, default: false },

    // --- latency (present on every row we manage to write) --------------
    /** Time to first streamed token, ms. Null if the stream never opened. */
    ttftMs: { type: Number, default: null },
    /** Whole request duration, ms. */
    totalMs: { type: Number, default: null },

    /** Optional, for correlating a spike with one student. Not required. */
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: false }
);

// Recent-errors table and the 24h breakdown both read failures newest-first.
errorEventSchema.index({ ok: 1, timestamp: -1 });

const ErrorEvent = models.ErrorEvent || model('ErrorEvent', errorEventSchema);
export default ErrorEvent;
