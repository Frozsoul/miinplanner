import type { Task } from "@/types";

/**
 * Pushed dates: moving a due date later counts as a "slip" when the task was already due,
 * so the companion and boards can't miss work that keeps getting pushed.
 *
 * A move counts as a slip when all of these hold:
 * - the task is open (not finished, not archived),
 * - it had a due date that was overdue, today or tomorrow,
 * - the new due date is on a later day,
 * - the task is more than an hour old (fixing a fresh typo isn't a slip).
 * Anything else (moving a task that's still days away, or earlier) is a plain date change.
 * The user can always undo the count with "It was a date fix".
 */

const DAY = 24 * 60 * 60 * 1000;
const FRESH_TASK_MS = 60 * 60 * 1000;
/** Slips in this window count against the momentum score and show in the companion's line. */
export const SLIP_WINDOW_DAYS = 7;
/** A day with this many open tasks due gets an "it's piling up" note when you push more onto it. */
export const BUSY_DAY_TASKS = 5;

function startOfDay(t: number): number {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function time(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return isNaN(t) ? null : t;
}

function createdTime(task: Task): number | null {
  const c = task.createdAt as unknown as { toDate?: () => Date } | undefined;
  return c && typeof c.toDate === "function" ? c.toDate().getTime() : null;
}

export function isSlip(task: Task, newDueDate: string | null | undefined, isDone: (t: Task) => boolean, now: Date = new Date()): boolean {
  if (task.archived || isDone(task)) return false;
  const oldDue = time(task.dueDate);
  const newDue = time(newDueDate);
  if (oldDue === null || newDue === null) return false;
  const today = startOfDay(now.getTime());
  if (startOfDay(oldDue) > today + DAY) return false; // still days away: just planning
  if (startOfDay(newDue) <= startOfDay(oldDue)) return false; // same day or earlier
  const created = createdTime(task);
  if (created !== null && now.getTime() - created < FRESH_TASK_MS) return false;
  return true;
}

/** Fields to write with the date change when it's a slip. */
export function slipFields(task: Task, now: Date = new Date()) {
  return {
    slipCount: (task.slipCount || 0) + 1,
    lastSlipAt: now.toISOString(),
    firstDueDate: task.firstDueDate || task.dueDate,
  };
}

/** Open tasks pushed in the last 7 days. */
export function slippedRecently(tasks: Task[], isDone: (t: Task) => boolean, now: Date = new Date()): Task[] {
  const since = now.getTime() - SLIP_WINDOW_DAYS * DAY;
  return tasks.filter(t => {
    if (t.archived || isDone(t) || !t.slipCount) return false;
    const at = time(t.lastSlipAt);
    return at !== null && at >= since;
  });
}

/** Open tasks due on the same day as `dueDate` (local time), not counting `exceptId`. */
export function openTasksDueOn(tasks: Task[], dueDate: string, isDone: (t: Task) => boolean, exceptId?: string): number {
  const day = time(dueDate);
  if (day === null) return 0;
  const target = startOfDay(day);
  return tasks.filter(t => {
    if (t.id === exceptId || t.archived || isDone(t)) return false;
    const d = time(t.dueDate);
    return d !== null && startOfDay(d) === target;
  }).length;
}
