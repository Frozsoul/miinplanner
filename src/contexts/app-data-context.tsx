
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskPriority, PrioritizedTaskSuggestion, TaskData, TaskForPrioritization } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, updateTask as updateTaskService } from '@/services/task-service';
import { prioritizeTasks as aiPrioritizeTasks, type PrioritizeTasksInput, type AIPrioritizedTask } from '@/ai/flows/prioritize-tasks-flow';
import { useToast } from '@/hooks/use-toast';

interface AppDataContextType {
  tasks: Task[];
  prioritizedSuggestions: PrioritizedTaskSuggestion[];
  isLoadingTasks: boolean;
  isLoadingAi: boolean;
  fetchTasks: () => Promise<void>;
  suggestTaskPrioritization: () => Promise<void>;
  updateTaskPriority: (taskId: string, newPriority: TaskPriority) => Promise<void>;
  dismissSuggestion: (taskId: string) => void;
  clearSuggestions: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const fetchUserTasks = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingTasks(true);
      try {
        const userTasks = await getTasks(user.uid);
        setTasks(userTasks);
      } catch (error) {
        console.error("AppDataContext: Failed to fetch tasks:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
      } finally {
        setIsLoadingTasks(false);
      }
    } else {
      setTasks([]);
      setIsLoadingTasks(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  const suggestTaskPrioritization = async () => {
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "Please log in to use AI prioritization.", variant: "destructive" });
      return;
    }
    const activeTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
    if (activeTasks.length === 0) {
      toast({ title: "No Tasks", description: "No active tasks available for AI prioritization.", variant: "default" });
      setPrioritizedSuggestions([]);
      return;
    }

    setIsLoadingAi(true);
    try {
      const aiInput: PrioritizeTasksInput = {
        tasks: activeTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate,
          tags: t.tags,
        } as TaskForPrioritization)), // Ensure type casting matches AI flow input
      };

      const result = await aiPrioritizeTasks(aiInput);
      
      const suggestions: PrioritizedTaskSuggestion[] = result.prioritizedTasks
        .filter(pt => pt.suggestedPriority !== undefined) // Ensure there's a suggestion
        .map((pt: AIPrioritizedTask) => {
          const originalTask = activeTasks.find(t => t.id === pt.id);
          return {
            taskId: pt.id,
            title: pt.title,
            currentPriority: originalTask?.priority || pt.priority, // Fallback to pt.priority if original not found (should not happen)
            suggestedPriority: pt.suggestedPriority!, // We filtered for undefined above
            reason: pt.reasoning || "AI suggested this priority.",
          };
        });
      
      setPrioritizedSuggestions(suggestions);
      if (suggestions.length === 0) {
        toast({title: "AI Analysis Complete", description: "No priority changes were suggested by the AI."});
      } else {
        toast({title: "AI Suggestions Ready", description: "Review the suggested task priorities below."});
      }

    } catch (error) {
      console.error("AppDataContext: AI prioritization failed:", error);
      toast({ title: "AI Error", description: "Could not get AI priority suggestions.", variant: "destructive" });
      setPrioritizedSuggestions([]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: TaskPriority) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      await updateTaskService(user.uid, taskId, { priority: newPriority });
      toast({ title: "Success", description: `Task priority updated to ${newPriority}.` });
      // Optimistically update local task state
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
      // Remove the suggestion for this task as it has been acted upon
      setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
    } catch (error) {
      console.error("AppDataContext: Failed to update task priority:", error);
      toast({ title: "Error", description: "Could not update task priority.", variant: "destructive" });
    }
  };
  
  const dismissSuggestion = (taskId: string) => {
    setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
    toast({ title: "Suggestion Dismissed", description: "The AI suggestion for this task has been dismissed."});
  };

  const clearSuggestions = () => {
    setPrioritizedSuggestions([]);
  }

  return (
    <AppDataContext.Provider value={{ 
      tasks, 
      prioritizedSuggestions, 
      isLoadingTasks, 
      isLoadingAi, 
      fetchTasks: fetchUserTasks, // Expose fetchUserTasks as fetchTasks
      suggestTaskPrioritization, 
      updateTaskPriority,
      dismissSuggestion,
      clearSuggestions
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};
