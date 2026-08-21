'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * /admin — single-page monitoring dashboard.
 *
 * Its main job is surfacing the tutor-quality patterns that were previously
 * only found by hand-reading transcripts: drift without progress, question
 * loops, misclassification spikes. The "stuck at level 0" panel is the
 * primary detector and is deliberately given headline placement.
 *
 * No charting library — distributions render as plain bars, which is legible
 * at this data size and keeps the student bundle unchanged.
 */

const RANGES = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['all', 'All time'],
];

const ERROR_TONE = {
  RATE_LIMITED: 'bg-newton-orange',
  UPSTREAM_503: 'bg-newton-orange',
  UPSTREAM_404: 'bg-red-500',
  STREAM_PARSE: 'bg-red-500',
  NETWORK: 'bg-red-500',
  MALFORMED_OUTPUT: 'bg-red-500',
  AI_ERROR: 'bg-red-500',
};

function Tile({ label, value, sub, tone = 'text-newton-bg' }) {
  return (
    <div className="bg-white border border-newton-bg/[0.08] rounded-2xl p-4">
      <p className="text-newton-bg/45 text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className={`${tone} text-2xl font-bold mt-1 tabular-nums`}>{value}</p>
      {sub && <p className="text-newton-bg/45 text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}

function Panel({ title, note, children }) {
  return (
    <section className="bg-white border border-newton-bg/[0.08] rounded-2xl p-4">
      <h2 className="text-newton-bg font-semibold text-sm">{title}</h2>
      {note && <p className="text-newton-bg/40 text-[11px] mt-0.5 mb-2">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Plain distribution bar — no chart library needed at this scale. */
function Bars({ data, colors = {} }) {
  const entries = Object.entries(data ?? {});
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (!total) return <p className="text-newton-bg/40 text-xs">No data yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-newton-bg/70">{key}</span>
            <span className="text-newton-bg/50 tabular-nums">
              {value} · {Math.round((value / total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-newton-bg/[0.07] overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[key] ?? 'bg-newton-blue-mid'}`}
              style={{ width: `${(value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [range, setRange] = useState('7d');
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = useCallback(async (r) => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetch(`/api/admin/summary?range=${r}`, { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setState({ loading: false, data: null, error: 'You do not have access to this page.' });
        return;
      }
      if (!res.ok || !body.ok) throw new Error(body.error || 'Request failed');
      setState({ loading: false, error: '', data: body.data });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message });
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const d = state.data;

  return (
    <div className="min-h-screen bg-newton-bg/[0.03] px-4 md:px-8 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-newton-bg font-bold text-lg">Newton AI · Monitoring</h1>
          {d && (
            <p className="text-newton-bg/40 text-[11px] mt-0.5">
              Generated {new Date(d.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white border border-newton-bg/[0.08] rounded-xl p-1">
          {RANGES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === key
                  ? 'bg-newton-blue-mid text-white'
                  : 'text-newton-bg/60 hover:bg-newton-bg/[0.05]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {state.loading && <p className="text-newton-bg/50 text-sm">Loading…</p>}
      {state.error && (
        <p role="alert" className="text-red-500 text-sm bg-white border border-red-200 rounded-xl p-4">
          {state.error}
        </p>
      )}

      {d && (
        <>
          {/* ── Six headline tiles ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <Tile label="Active today" value={d.usage.activeToday} sub={`${d.usage.totalUsers} registered`} />
            <Tile label="Sessions today" value={d.usage.sessionsToday} sub={`${d.usage.totalSessions} all time`} />
            <Tile label="Turns today" value={d.usage.turnsToday} />
            <Tile
              label="Understanding"
              value={`${d.quality.understanding.solid ?? 0} solid`}
              sub={`${d.quality.turns} turns in range`}
            />
            <Tile
              label="AI errors 24h"
              value={d.reliability.errors24h}
              sub={`${d.reliability.errorRate24h}% of ${d.reliability.requests24h}`}
              tone={d.reliability.errors24h > 0 ? 'text-red-500' : 'text-newton-bg'}
            />
            <Tile
              label="Stuck at level 0"
              value={d.quality.stuckAtLevelZero.length}
              sub="6+ turns, no progress"
              tone={d.quality.stuckAtLevelZero.length > 0 ? 'text-newton-orange' : 'text-newton-bg'}
            />
          </div>

          {/* ── The drift detector, given prominence ───────────────── */}
          <div className="mb-4">
            <Panel
              title="Sessions stuck at reveal level 0 (6+ turns)"
              note="The primary drift / question-loop detector. Each row links to that session's full transcript."
            >
              {d.quality.stuckAtLevelZero.length === 0 ? (
                <p className="text-newton-bg/40 text-xs">Nothing stuck. Good sign.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-newton-bg/40 text-left">
                        <th className="py-1.5 pr-3 font-medium">Session</th>
                        <th className="py-1.5 pr-3 font-medium">Subject</th>
                        <th className="py-1.5 pr-3 font-medium">Concept</th>
                        <th className="py-1.5 pr-3 font-medium text-right">Turns</th>
                        <th className="py-1.5 pr-3 font-medium">Last activity</th>
                        <th className="py-1.5 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {d.quality.stuckAtLevelZero.map((s) => (
                        <tr key={s.sessionId} className="border-t border-newton-bg/[0.06]">
                          <td className="py-2 pr-3 font-mono text-newton-bg/70">{s.sessionId.slice(-10)}</td>
                          <td className="py-2 pr-3 text-newton-bg/70 capitalize">{s.subject}</td>
                          <td className="py-2 pr-3 text-newton-bg/70">{s.concept ?? <span className="text-newton-orange">none set</span>}</td>
                          <td className="py-2 pr-3 text-right tabular-nums font-semibold text-newton-bg">{s.turns}</td>
                          <td className="py-2 pr-3 text-newton-bg/50 tabular-nums">
                            {new Date(s.updatedAt).toLocaleString()}
                          </td>
                          <td className="py-2">
                            <a
                              href={`/api/admin/session/${encodeURIComponent(s.sessionId)}`}
                              className="text-newton-blue-mid hover:text-newton-blue-bright font-semibold"
                            >
                              Transcript →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          {/* ── Tutor quality ──────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Panel title="Understanding distribution" note={`Turns in range (${d.range})`}>
              <Bars
                data={d.quality.understanding}
                colors={{ none: 'bg-red-400', partial: 'bg-newton-orange', solid: 'bg-newton-green' }}
              />
            </Panel>

            <Panel title="Advancement" note="Model recommends; MasteryEngine decides.">
              <dl className="space-y-1.5 text-xs">
                <Row k="recommendAdvance rate" v={`${d.quality.recommendAdvanceRate}%`} />
                <Row k="Vetoed by engine" v={`${d.quality.vetoed} (${d.quality.vetoRate}%)`} />
                <Row k="Asked for the answer" v={`${d.quality.studentRequestedAnswerRate}%`} />
                <Row k="Concept updates" v={d.quality.conceptUpdates} />
                <Row k="Subject switches" v={d.quality.subjectSwitches} />
              </dl>
            </Panel>

            <Panel title="Mistake types" note="Why wrong answers were wrong.">
              <Bars data={d.quality.mistakeTypes} />
            </Panel>
          </div>

          {/* ── Usage ──────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Panel title="Sessions per subject">
              <Bars data={Object.fromEntries(d.usage.perSubject.map((x) => [x.subject, x.sessions]))} />
            </Panel>

            <Panel title="Streak distribution">
              <Bars data={d.usage.streakBuckets} />
            </Panel>

            <Panel title="Engagement">
              <dl className="space-y-1.5 text-xs">
                <Row k="New signups today" v={d.usage.newToday} />
                <Row k="New signups 7d" v={d.usage.new7d} />
                <Row k="Active 7d" v={d.usage.active7d} />
                <Row k="Median turns / session" v={d.usage.turnsPerSession.median ?? '—'} />
                <Row k="p90 turns / session" v={d.usage.turnsPerSession.p90 ?? '—'} />
                <Row k="No concept ever set" v={d.usage.sessionsWithoutConcept} />
              </dl>
            </Panel>
          </div>

          {/* ── Top concepts + reliability ─────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Panel title="Top concepts">
              {d.usage.topConcepts.length === 0 ? (
                <p className="text-newton-bg/40 text-xs">No concepts established yet.</p>
              ) : (
                <ol className="space-y-1 text-xs">
                  {d.usage.topConcepts.map((c) => (
                    <li key={c.concept} className="flex justify-between gap-3">
                      <span className="text-newton-bg/70 truncate">{c.concept}</span>
                      <span className="text-newton-bg/45 tabular-nums shrink-0">{c.sessions}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title="Errors by cause" note="Last 24 hours.">
              <Bars data={d.reliability.byCause} colors={ERROR_TONE} />
            </Panel>

            <Panel title="Latency" note="Successful turns only — failures would skew it.">
              <dl className="space-y-1.5 text-xs">
                <Row k="Time to first token (median)" v={fmtMs(d.reliability.latency.ttftMedianMs)} />
                <Row k="Turn duration (median)" v={fmtMs(d.reliability.latency.totalMedianMs)} />
                <Row k="Turn duration (p90)" v={fmtMs(d.reliability.latency.totalP90Ms)} />
                <Row k="Samples" v={d.reliability.latency.samples} />
                <Row k="Retry exhausted 24h" v={d.reliability.retryExhausted24h} />
              </dl>
            </Panel>
          </div>

          {/* ── Recent errors ─────────────────────────────────────── */}
          <Panel title="Recent errors" note="Last 24 hours, newest first.">
            {d.reliability.recent.length === 0 ? (
              <p className="text-newton-bg/40 text-xs">No errors recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-newton-bg/40 text-left">
                      <th className="py-1.5 pr-3 font-medium">When</th>
                      <th className="py-1.5 pr-3 font-medium">Code</th>
                      <th className="py-1.5 pr-3 font-medium">Route</th>
                      <th className="py-1.5 pr-3 font-medium text-right">Retries</th>
                      <th className="py-1.5 pr-3 font-medium text-right">Took</th>
                      <th className="py-1.5 font-medium">Cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.reliability.recent.map((e, i) => (
                      <tr key={i} className="border-t border-newton-bg/[0.06]">
                        <td className="py-2 pr-3 text-newton-bg/50 tabular-nums whitespace-nowrap">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-mono font-semibold text-newton-bg/80">{e.errorCode}</span>
                        </td>
                        <td className="py-2 pr-3 font-mono text-newton-bg/50">{e.route}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-newton-bg/60">{e.retryCount}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-newton-bg/60">{fmtMs(e.totalMs)}</td>
                        <td className="py-2 text-newton-bg/50 max-w-md truncate" title={e.cause}>
                          {e.cause}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-newton-bg/60">{k}</dt>
      <dd className="text-newton-bg font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

function fmtMs(ms) {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}
