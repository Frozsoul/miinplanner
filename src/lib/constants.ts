
import type { TaskPriority, TaskStatus, Platform, PostStatus } from "@/types";

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
// Statuses for every new board: new users' personal board and new team workspaces.
export const NEW_BOARD_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
// The old five-status list. Only a fallback for old profiles and workspaces that never saved
// a list, so their tasks in Review or Pending keep a column. Don't use it for new boards.
export const DEFAULT_TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Pending', 'Done'];

export const SOCIAL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'General'];
export const POST_STATUSES: PostStatus[] = ['Draft', 'Scheduled', 'Posted', 'Needs Approval'];
