
import type { Timestamp } from "firebase/firestore";

export type TaskStatus = string; // No longer a union type, now a generic string
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string; // Stored as ISO string
  dueDate?: string; // Stored as ISO string
  channel?: string;
  assignee?: string;
  tags?: string[];
  completed: boolean;
  archived: boolean; // Added for archiving
  order?: number; // Added for explicit sorting
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
  userId: string;
}

// For creating/updating tasks, omitting server-generated fields and id
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'completed'> & { completed?: boolean };

// Task Spaces
export interface TaskSpace {
  id: string;
  name: string;
  createdAt: Date | Timestamp;
  tasks: TaskData[];
  taskStatuses?: TaskStatus[]; // Add statuses to task space
}

// AI Insights Types
export interface InsightTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  dueDate?: string; // ISO String
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
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface ContentIdea {
  id: string;
  text: string;
  keywords?: string;
  tone?: string;
  targetAudience?: string;
}

// This is now only used for typing the MotivationalQuote component's 'context' prop.
export interface GenerateQuoteInput {
  context: 'dashboard' | 'tasks' | 'calendar';
}

// User Profile and Plan Types
export type UserPlan = 'free' | 'premium';

export interface UserProfile {
  id: string; // Should match Firebase Auth UID
  email: string;
  displayName?: string;
  plan: UserPlan;
  createdAt: Date | Timestamp;
  taskStatuses?: TaskStatus[]; // Add custom statuses
}


// Authentication Form Data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends LoginFormData {
  confirmPassword?: string;
}

// Content Studio Types
export type Platform = 'X' | 'LinkedIn' | 'Instagram' | 'General';
export type PostStatus = 'Draft' | 'Scheduled' | 'Posted' | 'Needs Approval';

export interface SocialMediaPost {
  id: string; // Firestore document ID
  userId: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  scheduledDate?: string; // ISO string
  imageUrl?: string;
  notes?: string;
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
  // Optional fields if generated via AI
  topic?: string;
  tone?: string;
}

export type SocialMediaPostData = Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
