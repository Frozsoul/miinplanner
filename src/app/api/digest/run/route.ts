/**
 * Daily email digest runner: POST /api/digest/run
 *
 * Called every 15 minutes by Cloud Scheduler with `Authorization: Bearer <DIGEST_CRON_SECRET>`.
 * Sends each user their digest once a day, at their chosen local time (default 7:30), only
 * on days they have something due today or recently overdue. Rules: `src/lib/email-digest.ts`.
 *
 * Safety:
 * - A user's day is claimed in a transaction before sending, so overlapping runs can't double-send.
 * - A daily cap (DIGEST_DAILY_CAP, default 280) stays under Brevo's free 300 emails a day.
 * - Only verified email addresses, and only people who opened the app in the last 30 days.
 */

import { timingSafeEqual } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import { resolveDoneStatus } from '@/lib/task-status';
import { sendBrevoEmail } from '@/lib/brevo';
import { APP_URL, buildDigest, isDigestDue, localDateOf, type DigestTask } from '@/lib/email-digest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_DAILY_CAP = 280;
const CONCURRENCY = 5;

function authorized(req: Request): boolean {
  const secret = process.env.DIGEST_CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = req.headers.get('authorization') || '';
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ''));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

type Board = { statuses: string[]; doneStatus?: string | null };

// Same rule as the calendar feed: the board's finished status decides; very old accounts fall back to the flag.
function isDone(data: FirebaseFirestore.DocumentData, board: Board): boolean {
  if (board.statuses.length > 0) return data.status === resolveDoneStatus(board.statuses, board.doneStatus);
  return data.completed === true || data.status === 'Done';
}

/** Open tasks with a due date: personal board tasks, plus team tasks assigned to the user in workspaces they're still in. */
async function loadTasks(db: FirebaseFirestore.Firestore, uid: string, timeZone: string): Promise<{ tasks: DigestTask[]; name?: string }> {
  const [profile, own, assigned] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('tasks').where('userId', '==', uid).get(),
    db.collection('tasks').where('assignedTo', '==', uid).get(),
  ]);
  const personal: Board = { statuses: profile.get('taskStatuses') || [], doneStatus: profile.get('doneStatus') };

  const workspaces = new Map<string, { member: boolean; name: string; board: Board }>();
  const ids = new Set<string>();
  assigned.docs.forEach(d => { const w = d.get('workspaceId'); if (w) ids.add(w); });
  await Promise.all(Array.from(ids).map(async id => {
    const ws = await db.collection('workspaces').doc(id).get();
    const members: string[] = ws.get('memberUids') || [];
    workspaces.set(id, {
      member: ws.exists && members.includes(uid),
      name: ws.get('name') || 'Team',
      board: { statuses: ws.get('taskStatuses') || [], doneStatus: ws.get('doneStatus') },
    });
  }));

  const seen = new Set<string>();
  const tasks: DigestTask[] = [];
  const consider = (doc: FirebaseFirestore.QueryDocumentSnapshot, team: boolean) => {
    if (seen.has(doc.id)) return;
    const data = doc.data();
    const workspaceId: string | undefined = data.workspaceId || undefined;
    let board = personal;
    let teamName: string | undefined;
    if (team) {
      const info = workspaceId ? workspaces.get(workspaceId) : undefined;
      if (!info?.member) return;
      board = info.board;
      teamName = info.name;
    } else if (workspaceId) {
      return; // own tasks: personal board only; team tasks count when assigned to you
    }
    if (data.archived || isDone(data, board)) return;
    const due = toDate(data.dueDate);
    if (!due) return;
    seen.add(doc.id);
    tasks.push({
      id: doc.id,
      title: String(data.title || 'Untitled task').slice(0, 200),
      priority: data.priority || 'Medium',
      channel: data.channel || undefined,
      dueDate: localDateOf(due, timeZone),
      team: teamName,
    });
  };
  own.docs.forEach(d => consider(d, false));
  assigned.docs.forEach(d => consider(d, true));
  return { tasks, name: profile.get('displayName') || undefined };
}

type Outcome = 'sent' | 'empty' | 'skipped' | 'failed' | 'capped';

export async function POST(req: Request) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });

  const db = adminDb();
  const auth = getAuth(adminApp());
  const now = new Date();
  const cap = Number(process.env.DIGEST_DAILY_CAP) || DEFAULT_DAILY_CAP;
  const counterRef = db.collection('digestRuns').doc(now.toISOString().slice(0, 10)); // UTC day, matches Brevo's daily limit
  const tally: Record<Outcome, number> = { sent: 0, empty: 0, skipped: 0, failed: 0, capped: 0 };

  const enabled = await db.collection('emailDigests').where('enabled', '==', true).get();
  const due = enabled.docs.filter(d =>
    isDigestDue({
      enabled: true,
      timeZone: d.get('timeZone') || 'UTC',
      sendAt: d.get('sendAt'),
      lastSentDate: d.get('lastSentDate'),
      lastSeenAt: toDate(d.get('lastSeenAt')),
    }, now),
  );

  const processOne = async (doc: FirebaseFirestore.QueryDocumentSnapshot): Promise<Outcome> => {
    const uid = doc.id;
    const timeZone: string = doc.get('timeZone') || 'UTC';
    const today = localDateOf(now, timeZone);

    // Claim today for this user, and a slot under the daily cap if we end up sending.
    const claimed = await db.runTransaction(async tx => {
      const fresh = await tx.get(doc.ref);
      if (!fresh.get('enabled') || fresh.get('lastSentDate') === today) return false;
      tx.update(doc.ref, { lastSentDate: today, lastCheckedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) return 'skipped';

    const user = await auth.getUser(uid).catch(() => null);
    if (!user?.email || !user.emailVerified || user.disabled) return 'skipped';

    const { tasks, name } = await loadTasks(db, uid, timeZone);
    const unsubscribeUrl = `${APP_URL}/api/digest/unsubscribe?t=${encodeURIComponent(doc.get('unsubToken') || '')}`;
    const content = buildDigest(tasks, { today, name: name || user.displayName || undefined, unsubscribeUrl });
    if (!content) return 'empty';

    const slot = await db.runTransaction(async tx => {
      const c = await tx.get(counterRef);
      const sent = (c.get('sent') as number) || 0;
      if (sent >= cap) return false;
      tx.set(counterRef, { sent: sent + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return true;
    });
    if (!slot) {
      // Over the cap: release the day so a raised cap (or tomorrow) can still reach them.
      await doc.ref.update({ lastSentDate: FieldValue.delete() });
      return 'capped';
    }

    const result = await sendBrevoEmail({
      to: { email: user.email, name: name || user.displayName || undefined },
      subject: content.subject,
      html: content.html,
      text: content.text,
      unsubscribeUrl,
    });
    if (result.ok) {
      await doc.ref.update({ lastSentAt: FieldValue.serverTimestamp(), lastCounts: content.counts });
      return 'sent';
    }
    console.error(`Digest send failed for ${uid}: ${result.status} ${result.error}`);
    // Temporary errors: free the day so the next run retries (until noon local). Permanent ones: skip today.
    if (result.status === 0 || result.status === 429 || result.status >= 500) {
      await doc.ref.update({ lastSentDate: FieldValue.delete() });
    }
    await counterRef.set({ sent: FieldValue.increment(-1) }, { merge: true });
    return 'failed';
  };

  let capped = false;
  for (let i = 0; i < due.length && !capped; i += CONCURRENCY) {
    const outcomes = await Promise.all(due.slice(i, i + CONCURRENCY).map(d => processOne(d).catch(error => {
      console.error(`Digest failed for ${d.id}:`, error);
      return 'failed' as Outcome;
    })));
    outcomes.forEach(o => { tally[o]++; if (o === 'capped') capped = true; });
  }

  return Response.json({ ok: true, checked: enabled.size, due: due.length, ...tally }, { headers: { 'Cache-Control': 'no-store' } });
}
