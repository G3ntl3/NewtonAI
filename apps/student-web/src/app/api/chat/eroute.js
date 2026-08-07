/**
 * chat route handler
 * Receives a student message, calls @newton/ai runOrchestration(), returns Learning Blocks.
 *
 * Rule: this file must stay thin. Parse request, call a Controller,
 * return a Response. Business logic belongs in a Service, not here.
 */

export async function GET(request) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
