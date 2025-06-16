
import type { TaskPriority, TaskStatus, Platform, PostStatus } from "@/types";

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
export const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Blocked', 'Done'];

export const SOCIAL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'General'];
export const POST_STATUSES: PostStatus[] = ['Draft', 'Scheduled', 'Posted', 'Needs Approval'];
