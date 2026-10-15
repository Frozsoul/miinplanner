/**
 * Private calendar feed: GET /api/calendar/{token}.ics
 *
 * Returns the user's open tasks with a due date as all-day events, so Google, Apple or
 * Outlook Calendar can show them and remind the user. The token is the only credential,
 * so it is long and random, and the user can reset it from Settings > Reminders.
 *
 * Includes: personal tasks the user created, and team tasks assigned to them
 * (only for workspaces they are still a member of). Skips archived and done tasks.
 */

import { adminDb } from '@/lib/firebase-admin';
import { buildCalendar, localDate, type IcalEvent } from '@/lib/ical';
import { resolveDoneStatus } from '@/lib/task-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_URL = 'https://planner.miindigital.com';
const MAX_EVENTS = 500;
const LOOKBACK_DAYS = 30;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// The status is the source of truth: a task is done when it sits in the board's finished status.
// Without a status list (very old accounts), fall back to the stored flag or "Done".
function isDone(data: FirebaseFirestore.DocumentData, board: { statuses: string[]; doneStatus?: string | null }): boolean {
  if (board.statuses.length > 0) return data.status === resolveDoneStatus(board.statuses, board.doneStatus);
  return data.completed === true || data.status === 'Done';
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/, '');
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return notFound();

  try {
    const db = adminDb();
    const feed = await db.collection('calendarFeeds').doc(token).get();
    if (!feed.exists) return notFound();
    const uid = feed.get('uid') as string;
    const timeZone = (feed.get('timeZone') as string) || 'UTC';

    const [profile, ownTasks, assignedTasks] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('tasks').where('userId', '==', uid).get(),
      db.collection('tasks').where('assignedTo', '==', uid).get(),
    ]);
    const personalBoard = { statuses: (profile.get('taskStatuses') || []) as string[], doneStatus: profile.get('doneStatus') as string | undefined };

    // Workspace status lists and membership, loaded once per workspace.
    const workspaceInfo = new Map<string, { member: boolean; statuses: string[]; doneStatus?: string }>();
    const workspaceIds = new Set<string>();
    assignedTasks.docs.forEach(d => { const w = d.get('workspaceId'); if (w) workspaceIds.add(w); });
    await Promise.all(
      Array.from(workspaceIds).map(async id => {
        const ws = await db.collection('workspaces').doc(id).get();
        const members: string[] = ws.get('memberUids') || [];
        workspaceInfo.set(id, { member: ws.exists && members.includes(uid), statuses: ws.get('taskStatuses') || [], doneStatus: ws.get('doneStatus') });
      }),
    );

    const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    const seen = new Set<string>();
    const events: IcalEvent[] = [];

    const consider = (doc: FirebaseFirestore.QueryDocumentSnapshot, team: boolean) => {
      if (seen.has(doc.id)) return;
      const data = doc.data();
      const workspaceId: string | undefined = data.workspaceId || undefined;
      if (!team && workspaceId) return; // own tasks: personal board only
      let board: { statuses: string[]; doneStatus?: string | null } = personalBoard;
      if (team) {
        if (!workspaceId) return;
        const info = workspaceInfo.get(workspaceId);
        if (!info?.member) return;
        board = info;
      }
      if (data.archived || isDone(data, board)) return;
      const due = toDate(data.dueDate);
      if (!due || due.getTime() < cutoff) return;
      seen.add(doc.id);

      const priority: string = data.priority || 'Medium';
      const urgent = priority === 'Urgent' || priority === 'High';
      const details = [
        `Priority: ${priority}`,
        data.status ? `Status: ${data.status}` : '',
        data.channel ? `Channel: ${data.channel}` : '',
        team ? 'Team task assigned to you' : '',
        data.description ? `\n${String(data.description).slice(0, 1000)}` : '',
      ].filter(Boolean).join('\n');

      events.push({
        uid: `${doc.id}@planner.miindigital.com`,
        date: localDate(due, timeZone),
        summary: `${urgent ? `[${priority}] ` : ''}${String(data.title || 'Untitled task').slice(0, 200)}`,
        description: `${details}\n\nOpen MiinPlanner: ${APP_URL}/tasks`,
        url: `${APP_URL}/tasks`,
        // 9am on the due day; high and urgent tasks also get a heads-up at 9am the day before.
        alarms: urgent ? ['-PT15H', 'PT9H'] : ['PT9H'],
        stamp: toDate(data.updatedAt) || new Date(),
      });
    };

    ownTasks.docs.forEach(d => consider(d, false));
    assignedTasks.docs.forEach(d => consider(d, true));
    events.sort((a, b) => a.date.localeCompare(b.date));

    const body = buildCalendar('MiinPlanner tasks', events.slice(0, MAX_EVENTS));
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="miinplanner.ics"',
        'Cache-Control': 'private, max-age=900',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Calendar feed failed:', error);
    return new Response('Calendar feed is unavailable right now.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
