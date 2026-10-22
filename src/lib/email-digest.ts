/**
 * Daily email digest: the pure parts (when to send, what to put in it). No Firestore or
 * network here, so it can be tested on its own. Sending lives in `src/app/api/digest/run`.
 */

export const APP_URL = 'https://planner.miindigital.com';

/** Times a user can pick in Settings > Reminders. Local time, "HH:MM". */
export const DIGEST_TIMES = ['06:00', '07:00', '07:30', '08:00', '09:00'] as const;
export const DEFAULT_DIGEST_TIME = '07:30';

/** Overdue tasks older than this are only counted, not listed, so old boards don't nag forever. */
export const OVERDUE_LIST_DAYS = 14;
/** No email if the user hasn't opened the app in this many days. Protects the daily quota and our sender reputation. */
export const INACTIVE_DAYS = 30;
/** Don't send a morning email after this local hour (if the scheduler was down, skip the day instead). */
export const LATEST_SEND_HOUR = 12;

export function cleanTimeZone(tz: unknown): string {
  if (typeof tz !== 'string' || tz.length > 64) return 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export function cleanDigestTime(t: unknown): string {
  return typeof t === 'string' && (DIGEST_TIMES as readonly string[]).includes(t) ? t : DEFAULT_DIGEST_TIME;
}

/** Local "YYYY-MM-DD" and minutes since midnight for an instant in a time zone. */
export function localClock(instant: Date, timeZone: string): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function localDateOf(instant: Date, timeZone: string): string {
  return localClock(instant, timeZone).date;
}

/** Days from local date a to local date b ("YYYY-MM-DD"), b minus a. */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export interface DigestSchedule {
  enabled: boolean;
  timeZone: string;
  sendAt: string; // "HH:MM"
  lastSentDate?: string | null; // local "YYYY-MM-DD"
  lastSeenAt?: Date | null;
}

/** True when it's past the user's send time today, before noon, not sent yet today, and the user is still active. */
export function isDigestDue(s: DigestSchedule, now: Date): boolean {
  if (!s.enabled) return false;
  if (!s.lastSeenAt || now.getTime() - s.lastSeenAt.getTime() > INACTIVE_DAYS * 86_400_000) return false;
  const { date, minutes } = localClock(now, s.timeZone);
  if (s.lastSentDate === date) return false;
  const [h, m] = cleanDigestTime(s.sendAt).split(':').map(Number);
  return minutes >= h * 60 + m && minutes < LATEST_SEND_HOUR * 60;
}

export interface DigestTask {
  id: string;
  title: string;
  priority: string;
  channel?: string;
  /** Local due date, "YYYY-MM-DD". */
  dueDate: string;
  /** Workspace name when it's a team task assigned to the user. */
  team?: string;
}

export interface DigestContent {
  subject: string;
  html: string;
  text: string;
  counts: { today: number; overdue: number; tomorrow: number };
}

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

function byPriority(a: DigestTask, b: DigestTask): number {
  return (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2) || a.title.localeCompare(b.title);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function prettyDate(local: string): string {
  return new Date(`${local}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * Builds the email, or returns null when there's nothing due today and nothing recently overdue
 * (no "nothing to do" emails).
 */
export function buildDigest(tasks: DigestTask[], opts: { today: string; name?: string; unsubscribeUrl: string }): DigestContent | null {
  const today: DigestTask[] = [];
  const overdue: (DigestTask & { late: number })[] = [];
  const tomorrow: DigestTask[] = [];
  let olderOverdue = 0;

  for (const t of tasks) {
    const diff = dayDiff(opts.today, t.dueDate);
    if (diff === 0) today.push(t);
    else if (diff === 1 && (t.priority === 'High' || t.priority === 'Urgent')) tomorrow.push(t);
    else if (diff < 0) {
      if (-diff <= OVERDUE_LIST_DAYS) overdue.push({ ...t, late: -diff });
      else olderOverdue++;
    }
  }
  if (today.length === 0 && overdue.length === 0) return null;

  today.sort(byPriority);
  tomorrow.sort(byPriority);
  overdue.sort((a, b) => a.late - b.late || byPriority(a, b));

  const parts = [
    today.length ? `${today.length} due today` : '',
    overdue.length ? `${overdue.length} overdue` : '',
  ].filter(Boolean);
  const subject = `${parts.join(', ')}: your MiinPlanner day`;

  const detail = (t: DigestTask, extra?: string) =>
    [t.priority === 'High' || t.priority === 'Urgent' ? t.priority : '', t.channel, t.team ? `Team: ${t.team}` : '', extra]
      .filter(Boolean).join(' · ');

  type Section = { title: string; items: { title: string; detail: string }[]; note?: string };
  const sections: Section[] = [];
  if (today.length) sections.push({ title: 'Due today', items: today.map(t => ({ title: t.title, detail: detail(t) })) });
  if (overdue.length || olderOverdue) {
    sections.push({
      title: 'Overdue',
      items: overdue.map(t => ({ title: t.title, detail: detail(t, `due ${prettyDate(t.dueDate)}, ${t.late} day${t.late === 1 ? '' : 's'} late`) })),
      note: olderOverdue ? `Plus ${olderOverdue} older overdue task${olderOverdue === 1 ? '' : 's'}. Finish, move or archive them so they stop piling up.` : undefined,
    });
  }
  if (tomorrow.length) sections.push({ title: 'Heads-up for tomorrow', items: tomorrow.map(t => ({ title: t.title, detail: detail(t) })) });

  const greeting = opts.name ? `Morning ${opts.name.split(' ')[0]},` : 'Morning,';
  const intro = 'Here is what needs you today.';
  const openUrl = `${APP_URL}/tasks`;

  const text = [
    greeting,
    intro,
    '',
    ...sections.flatMap(s => [
      `${s.title} (${s.items.length})`,
      ...s.items.map(i => `- ${i.title}${i.detail ? ` (${i.detail})` : ''}`),
      ...(s.note ? [s.note] : []),
      '',
    ]),
    `Open MiinPlanner: ${openUrl}`,
    '',
    `You get this email on days you have something due. Turn it off: ${opts.unsubscribeUrl}`,
  ].join('\n');

  const sectionHtml = sections.map(s => `
    <h2 style="font-size:15px;margin:24px 0 8px;color:#111">${escapeHtml(s.title)} (${s.items.length})</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${s.items.map(i => `
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee">
        <div style="font-size:14px;color:#111">${escapeHtml(i.title)}</div>
        ${i.detail ? `<div style="font-size:12px;color:#666;margin-top:2px">${escapeHtml(i.detail)}</div>` : ''}
      </td></tr>`).join('')}
    </table>
    ${s.note ? `<p style="font-size:12px;color:#666;margin:8px 0 0">${escapeHtml(s.note)}</p>` : ''}`).join('');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f4">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="background:#fff;border-radius:12px;padding:24px">
      <p style="font-size:14px;color:#111;margin:0 0 4px">${escapeHtml(greeting)}</p>
      <p style="font-size:14px;color:#444;margin:0">${escapeHtml(intro)}</p>
      ${sectionHtml}
      <p style="margin:28px 0 0"><a href="${openUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;padding:10px 18px;border-radius:8px">Open MiinPlanner</a></p>
    </div>
    <p style="font-size:11px;color:#888;margin:16px 0 0;text-align:center">
      You get this email on days you have something due. <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#888">Turn it off</a> or change the time in Settings &gt; Reminders.
    </p>
  </div></body></html>`;

  return { subject, html, text, counts: { today: today.length, overdue: overdue.length, tomorrow: tomorrow.length } };
}
