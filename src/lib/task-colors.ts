import type { TaskPriority } from "@/types";
import { resolveDoneStatus } from "@/lib/task-status";

/** Soft, readable pill styles per priority (light and dark). */
export const PRIORITY_PILL: Record<TaskPriority, string> = {
  Urgent: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  High: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  Medium: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  Low: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
};

/** Left accent stripe on task cards, so priority reads at a glance. */
export const PRIORITY_STRIPE: Record<TaskPriority, string> = {
  Urgent: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-sky-500",
  Low: "border-l-slate-300 dark:border-l-slate-600",
};

/** Dot colors for status columns, by position in the user's status list. The board's finished status is green. */
const STATUS_DOTS = ["bg-slate-400", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-pink-500", "bg-teal-500"];

export function statusDotClass(status: string, statuses: string[], doneStatus?: string | null): string {
  if (status === "Archived") return "bg-muted-foreground/40";
  const index = statuses.indexOf(status);
  if (status === (doneStatus ?? resolveDoneStatus(statuses))) return "bg-green-500";
  return STATUS_DOTS[(index < 0 ? 0 : index) % STATUS_DOTS.length];
}

/** True when `status` is the board's finished status. Pass `doneStatus` from useAppData() when you have it. */
export function isDoneStatus(status: string | undefined, statuses: string[], doneStatus?: string | null): boolean {
  if (!status) return false;
  return status === (doneStatus ?? resolveDoneStatus(statuses));
}
