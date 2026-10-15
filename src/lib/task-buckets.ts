import type { Task, TaskPriority } from "@/types";

/**
 * Time groups for open tasks, worked out from the due date every time (never stored).
 * Used to sort boards so what needs attention now comes first.
 */
export type DueBucket = "overdue" | "today" | "week" | "later" | "none";

export const BUCKET_LABEL: Record<DueBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "Next 7 days",
  later: "Later",
  none: "No due date",
};

const BUCKET_RANK: Record<DueBucket, number> = { overdue: 0, today: 1, week: 2, later: 3, none: 4 };
const PRIORITY_RANK: Record<TaskPriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dueTime(task: Pick<Task, "dueDate">): number | null {
  if (!task.dueDate) return null;
  const t = new Date(task.dueDate).getTime();
  return isNaN(t) ? null : t;
}

export function dueBucket(task: Pick<Task, "dueDate">, now: Date = new Date()): DueBucket {
  const due = dueTime(task);
  if (due === null) return "none";
  const today = startOfDay(now);
  const dueDay = startOfDay(new Date(due));
  if (dueDay < today) return "overdue";
  if (dueDay === today) return "today";
  if (dueDay <= today + 7 * 24 * 60 * 60 * 1000) return "week";
  return "later";
}

/** Overdue, today, next 7 days, later, no date; then priority; then earliest due; then title. */
export function compareByUrgency(a: Task, b: Task, now: Date = new Date()): number {
  const bucket = BUCKET_RANK[dueBucket(a, now)] - BUCKET_RANK[dueBucket(b, now)];
  if (bucket !== 0) return bucket;
  const priority = (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
  if (priority !== 0) return priority;
  const da = dueTime(a) ?? Infinity;
  const db = dueTime(b) ?? Infinity;
  if (da !== db) return da - db;
  return (a.title || "").localeCompare(b.title || "");
}

/** When a task was finished: completedAt, else its last update. */
export function finishedTime(task: Task): number {
  if (task.completedAt) {
    const t = new Date(task.completedAt).getTime();
    if (!isNaN(t)) return t;
  }
  return task.updatedAt?.toDate ? task.updatedAt.toDate().getTime() : 0;
}

export const RECENT_DAYS = 7;

export function finishedRecently(task: Task, now: Date = new Date()): boolean {
  return finishedTime(task) >= now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000;
}
