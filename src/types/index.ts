
import type { Timestamp } from "firebase/firestore";

export type TaskStatus = string;
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  channel?: string;
  tags?: string[];
  completed: boolean;
  archived: boolean;
  order?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  workspaceId?: string; // Associated workspace
  assignedTo?: string; // UID of assigned user
}

export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'completed'> & { completed?: boolean };

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  memberUids: string[];
  taskStatuses?: TaskStatus[]; // Shared statuses for the workspace
  createdAt: Date | Timestamp;
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName?: string;
}

export interface TaskSpace {
  id: string;
  name: string;
  createdAt: Date | Timestamp;
  tasks: TaskData[];
  taskStatuses?: TaskStatus[];
}

export interface InsightTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface AtRiskTaskInsight {
  taskId: string;
  title: string;
  dueDate: string;
  reason: string;
}

export interface StalledTaskInsight {
  taskId: string;
  title: string;
  lastUpdate: string;
  reason: string;
}

export interface AIInsights {
  type: 'full';
  summary: string;
  productivityScore: number;
  completionRate: {
    daily: number;
    weekly: number;
  };
  averageCompletionTimeHours: number;
  atRiskTasks: AtRiskTaskInsight[];
  stalledTasks: StalledTaskInsight[];
  proactiveSuggestions: string[];
}

export interface SimpleInsights {
    type: 'simple';
    totalTasks: number;
    tasksToDo: number;
    highPriorityTasks: number;
    message: string;
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

export interface GenerateQuoteInput {
  context: 'dashboard' | 'tasks' | 'calendar';
}

export type UserPlan = 'free';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  plan: UserPlan;
  createdAt: Date | Timestamp;
  taskStatuses?: TaskStatus[];
  insightGenerationCount?: number;
  lastInsightGenerationDate?: string;
  chatbotMessageCount?: number;
  lastChatbotMessageDate?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends LoginFormData {
  confirmPassword?: string;
}
