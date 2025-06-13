
import type { Timestamp } from "firebase/firestore";

export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string; // Stored as ISO string in component state, converted to/from Timestamp for Firestore
  completed: boolean;
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
  // Add other fields like displayName if needed during signup
}

// For creating tasks/reminders, ID is not needed as Firestore generates it
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'userId'>;
export type ReminderData = Omit<Reminder, 'id' | 'createdAt' | 'userId' | 'triggered'>;
