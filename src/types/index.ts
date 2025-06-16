
import type { Timestamp } from "firebase/firestore";

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked' | 'Review';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus; // Changed from stage
  dueDate?: string; // Stored as ISO string
  channel?: string;
  assignee?: string;
  tags?: string[];
  completed: boolean;
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
  userId: string;
}

// For creating/updating tasks, omitting server-generated fields and id
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'completed'> & { completed?: boolean };


export interface PrioritizedTaskSuggestion {
  taskId: string;
  title: string;
  currentPriority: TaskPriority;
  suggestedPriority: TaskPriority;
  reason: string;
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

// Authentication Form Data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends LoginFormData {
  confirmPassword?: string;
}

// For AI flow input (matching the flow's Zod schema)
export type TaskForPrioritization = {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  tags?: string[];
};

export type AIPrioritizedTask = TaskForPrioritization & {
  suggestedPriority?: TaskPriority;
  reasoning?: string;
};

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
