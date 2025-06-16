
import type { Timestamp } from "firebase/firestore";

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked' | 'Review';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus; // Changed from 'stage'
  dueDate?: string; // Stored as ISO string
  channel?: string;
  assignee?: string;
  tags?: string[];
  completed: boolean;
  createdAt?: Timestamp; // Firestore server timestamp
  updatedAt?: Timestamp; // Firestore server timestamp
  userId?: string;
}

export interface PrioritizedTaskSuggestion {
  taskId: string;
  title: string;
  currentPriority: TaskPriority;
  suggestedPriority: TaskPriority;
  reason: string;
  // Original task data can be useful for context if needed later
  // originalTask: Omit<Task, 'id' | 'priority'> & { priority: TaskPriority };
}

export interface Reminder {
  id: string; // Firestore document ID
  title: string;
  remindAt: string; // Stored as ISO string
  triggered: boolean;
  createdAt?: Timestamp; // Firestore server timestamp
  userId?: string;
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

// For creating/updating tasks
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'completed'> & { completed?: boolean };
export type ReminderData = Omit<Reminder, 'id' | 'createdAt' | 'userId' | 'triggered'>;

// For AI flow input (matching the flow's Zod schema)
export type TaskForPrioritization = {
  id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'; // Matches flow's enum
  dueDate?: string;
  tags?: string[];
};

export type AIPrioritizedTask = TaskForPrioritization & {
  suggestedPriority?: 'Low' | 'Medium' | 'High' | 'Urgent'; // Matches flow's enum
  reasoning?: string;
};
