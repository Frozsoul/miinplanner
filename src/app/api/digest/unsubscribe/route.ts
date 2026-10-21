/**
 * Turn off the daily email: /api/digest/unsubscribe?t=<token>
 *
 * GET shows a confirm page with a button (mail scanners open links, so a GET never changes
 * anything). POST turns the digest off: from that button, or from the email client's
 * one-click unsubscribe (RFC 8058, List-Unsubscribe-Post).
 */

import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validToken(t: string | null): t is string {
  return !!t && /^[A-Za-z0-9_-]{20,64}$/.test(t);
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#f4f4f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:480px;margin:48px auto;padding:0 16px"><div style="background:#fff;border-radius:12px;padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}</div></div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

const settingsLink = '<p style="font-size:14px;color:#444">You can turn it back on or change the time in <a href="https://planner.miindigital.com/settings/reminders">Settings &gt; Reminders</a>.</p>';

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t');
  if (!validToken(t)) return page('Link not valid', '<p style="font-size:14px;color:#444">This link is broken or old. You can turn off the email in Settings &gt; Reminders.</p>', 404);
  return page('Turn off the daily email?', `
<p style="font-size:14px;color:#444">You'll stop getting the MiinPlanner morning email. Your tasks and calendar reminders stay as they are.</p>
<form method="post" action="/api/digest/unsubscribe?t=${encodeURIComponent(t)}">
<button type="submit" style="background:#111;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer">Turn off</button>
</form>`);
}

export async function POST(req: Request) {
  const t = new URL(req.url).searchParams.get('t');
  if (!validToken(t)) return page('Link not valid', '<p style="font-size:14px;color:#444">This link is broken or old.</p>', 404);
  try {
    const db = adminDb();
    const match = await db.collection('emailDigests').where('unsubToken', '==', t).limit(1).get();
    if (match.empty) return page('Link not valid', '<p style="font-size:14px;color:#444">This link is broken or old.</p>', 404);
    await match.docs[0].ref.update({ enabled: false });
    return page('Daily email turned off', settingsLink);
  } catch (error) {
    console.error('Digest unsubscribe failed:', error);
    return page('Something went wrong', '<p style="font-size:14px;color:#444">Please try again in a moment, or turn it off in Settings &gt; Reminders.</p>', 503);
  }
}
