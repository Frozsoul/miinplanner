
import type { TaskPriority, TaskStatus, Platform, PostStatus } from "@/types";

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
// This is now the default set for new users or fallback. The primary source will be the user's profile.
export const DEFAULT_TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Pending', 'Done'];

export const SOCIAL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'General'];
export const POST_STATUSES: PostStatus[] = ['Draft', 'Scheduled', 'Posted', 'Needs Approval'];
