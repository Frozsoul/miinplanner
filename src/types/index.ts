
import type { Timestamp } from "firebase/firestore";

export const TASK_STAGES = ["To Do", "In Progress", "Done", "Review"] as const;
export type TaskStage = (typeof TASK_STAGES)[number];

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string; // Stored as ISO string in component state, converted to/from Timestamp for Firestore
  completed: boolean; // Will be primarily relevant for the "Done" stage
  stage: TaskStage;
  tags?: string[];
  createdAt?: Timestamp; // Optional: Firestore server timestamp
  userId?: string; // To associate task with user
}

export interface Reminder {
  id: string; // Firestore document ID
  title: string;
  remindAt: string; // Stored as ISO string, converted to/from Timestamp for Firestore
  triggered: boolean; 
  createdAt?: Timestamp; // Optional: Firestore server timestamp
  userId?: string; // To associate reminder with user
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

// For creating/updating tasks, ID is not needed as Firestore generates it or it's already known
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'userId' | 'completed'> & { completed?: boolean };
export type ReminderData = Omit<Reminder, 'id' | 'createdAt' | 'userId' | 'triggered'>;

// AI Prioritization Types
export type AIPrioritizedTask = Pick<Task, 'id' | 'title' | 'priority' | 'dueDate' | 'tags' | 'description'> & { suggestedPriority?: 'Low' | 'Medium' | 'High'; reasoning?: string };

