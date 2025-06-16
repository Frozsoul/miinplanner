
import type { Timestamp } from "firebase/firestore";

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked' | 'Review'; // Added Review based on original Kanban
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'; // Added Urgent for display

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string; // Stored as ISO string
  channel?: string;
  assignee?: string;
  tags?: string[];
  completed: boolean; // Kept for potential direct use, though status='Done' is primary
  createdAt?: Timestamp; // Firestore server timestamp
  updatedAt?: Timestamp; // Firestore server timestamp
  userId?: string; // To associate task with user
}

export interface Reminder {
  id: string; // Firestore document ID
  title: string;
  remindAt: string; // Stored as ISO string
  triggered: boolean; 
  createdAt?: Timestamp; // Firestore server timestamp
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

// For creating/updating tasks
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'completed'> & { completed?: boolean };
export type ReminderData = Omit<Reminder, 'id' | 'createdAt' | 'userId' | 'triggered'>;

// AI Prioritization Types - ensure fields here match what AI flow expects
export type AIPrioritizedTask = Pick<Task, 'id' | 'title' | 'priority' | 'dueDate' | 'tags' | 'description'> & { 
  suggestedPriority?: TaskPriority; 
  reasoning?: string 
};
