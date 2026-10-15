/**
 * Which status means "finished" on a board.
 *
 * Users can rename, reorder and delete statuses, so "Done" can't be assumed. Each board
 * (personal profile or workspace) stores one `doneStatus`. When it isn't set yet, we fall
 * back to "Done" if the list has it, otherwise the last status, which matches how the app
 * behaved before the setting existed.
 *
 * Pure functions only: used by client components and by the calendar feed route.
 */

export function resolveDoneStatus(statuses: string[] | undefined | null, stored?: string | null): string | null {
  const list = statuses || [];
  if (stored && list.includes(stored)) return stored;
  if (list.includes('Done')) return 'Done';
  return list.length > 0 ? list[list.length - 1] : null;
}

/** True when the task's status is the board's finished status. */
export function isFinished(status: string | undefined | null, doneStatus: string | null): boolean {
  return !!status && !!doneStatus && status === doneStatus;
}

/** Fields to write whenever a task's status changes, so `completed` always matches the status. */
export function completionFields(newStatus: string, doneStatus: string | null): { completed: boolean; completedAt: Date | null } {
  const done = isFinished(newStatus, doneStatus);
  return { completed: done, completedAt: done ? new Date() : null };
}
