
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string; // Store as ISO string for localStorage
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  remindAt: string; // Store as ISO string
  triggered: boolean; // Not used yet, but good for future
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
