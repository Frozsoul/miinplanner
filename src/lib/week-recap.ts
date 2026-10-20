import type { Task, WorkspaceMember } from "@/types";
import { compareByUrgency, dueBucket, dueTime, finishedRecently, finishedTime } from "@/lib/task-buckets";

/**
 * Monday team recap: "done last 7 days, slipped, due next 7 days", by person on a
 * workspace board, as plain text to paste into a team chat. Worked out in code from the
 * board's tasks (no AI, nothing stored), so it is instant, free and always matches the board.
 */

export interface RecapInput {
  tasks: Task[];
  isDone: (task: Task) => boolean;
  boardName: string;
  /** Workspace members. Empty on a personal board, which gives a flat recap. */
  members?: WorkspaceMember[];
  now?: Date;
}

export interface RecapCounts {
  done: number;
  overdue: number;
  dueSoon: number;
}

/** Most items listed per person per section; the rest become "and N more". */
const MAX_PER_PERSON = 8;
const DAY = 24 * 60 * 60 * 1000;
const NONE = "__unassigned";
const FORMER = "__former";

function shortDate(t: number): string {
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dayAndDate(t: number): string {
  return new Date(t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function memberName(m: WorkspaceMember): string {
  return m.displayName?.trim() || m.email.split("@")[0];
}

function taskLine(task: Task, detail?: string): string {
  const extras = [task.channel?.trim(), detail].filter(Boolean).join(", ");
  return `${task.title.trim() || "Untitled task"}${extras ? ` (${extras})` : ""}`;
}

function daysLate(due: number, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(new Date(due).getFullYear(), new Date(due).getMonth(), new Date(due).getDate()).getTime();
  return Math.max(1, Math.round((today - dueDay) / DAY));
}

export function recapSections(tasks: Task[], isDone: (t: Task) => boolean, now: Date = new Date()) {
  // Finished work counts even if it was archived afterwards.
  const done = tasks
    .filter(t => isDone(t) && finishedRecently(t, now))
    .sort((a, b) => finishedTime(a) - finishedTime(b));
  const open = tasks.filter(t => !t.archived && !isDone(t)).sort((a, b) => compareByUrgency(a, b, now));
  const overdue = open.filter(t => dueBucket(t, now) === "overdue");
  const dueSoon = open.filter(t => {
    const b = dueBucket(t, now);
    return b === "today" || b === "week";
  });
  return { done, overdue, dueSoon };
}

export function recapCounts(tasks: Task[], isDone: (t: Task) => boolean, now: Date = new Date()): RecapCounts {
  const s = recapSections(tasks, isDone, now);
  return { done: s.done.length, overdue: s.overdue.length, dueSoon: s.dueSoon.length };
}

export function buildWeekRecap({ tasks, isDone, boardName, members = [], now = new Date() }: RecapInput): string {
  const { done, overdue, dueSoon } = recapSections(tasks, isDone, now);
  const byPerson = members.length > 0;
  const names = new Map(members.map(m => [m.uid, memberName(m)]));

  const personOf = (t: Task): string => {
    if (!t.assignedTo) return "Unassigned";
    return names.get(t.assignedTo) || "Former member";
  };

  const section = (title: string, list: Task[], detail: (t: Task) => string | undefined): string[] => {
    const out = [`${title} (${list.length})`];
    if (list.length === 0) {
      out.push("- Nothing");
      return out;
    }
    if (!byPerson) {
      list.slice(0, MAX_PER_PERSON * 2).forEach(t => out.push(`- ${taskLine(t, detail(t))}`));
      if (list.length > MAX_PER_PERSON * 2) out.push(`- and ${list.length - MAX_PER_PERSON * 2} more`);
      return out;
    }
    // Members in workspace order, then Unassigned and Former member. Keyed by uid so two
    // members with the same name stay separate.
    const keyOf = (t: Task) => (!t.assignedTo ? NONE : names.has(t.assignedTo) ? t.assignedTo : FORMER);
    const order = [...members.map(m => m.uid), NONE, FORMER];
    const groups = new Map<string, Task[]>();
    list.forEach(t => {
      const k = keyOf(t);
      groups.set(k, [...(groups.get(k) || []), t]);
    });
    order.filter(k => groups.has(k)).forEach(k => {
      const items = groups.get(k)!;
      out.push(`${personOf(items[0])} (${items.length})`);
      items.slice(0, MAX_PER_PERSON).forEach(t => out.push(`  - ${taskLine(t, detail(t))}`));
      if (items.length > MAX_PER_PERSON) out.push(`  - and ${items.length - MAX_PER_PERSON} more`);
    });
    return out;
  };

  const from = shortDate(now.getTime() - 6 * DAY);
  const to = shortDate(now.getTime());
  const lines = [
    `Week recap: ${boardName} (${from} to ${to})`,
    "",
    ...section("Done in the last 7 days", done, () => undefined),
    "",
    ...section("Slipped", overdue, t => {
      const due = dueTime(t)!;
      const late = daysLate(due, now);
      return `due ${shortDate(due)}, ${late} day${late === 1 ? "" : "s"} late`;
    }),
    "",
    ...section("Due in the next 7 days", dueSoon, t => (dueBucket(t, now) === "today" ? "today" : dayAndDate(dueTime(t)!))),
  ];
  return lines.join("\n");
}
