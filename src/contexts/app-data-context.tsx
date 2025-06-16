
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskPriority, PrioritizedTaskSuggestion, TaskData, TaskForPrioritization, SocialMediaPost, SocialMediaPostData, Platform } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/task-service';
import { getSocialMediaPosts, addSocialMediaPost as addPostService, updateSocialMediaPost as updatePostService, deleteSocialMediaPost as deletePostService } from '@/services/social-media-post-service';
import { prioritizeTasks as aiPrioritizeTasks, type PrioritizeTasksInput, type AIPrioritizedTask } from '@/ai/flows/prioritize-tasks-flow';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, type GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from '@/hooks/use-toast';

interface AppDataContextType {
  // Tasks
  tasks: Task[];
  isLoadingTasks: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: TaskData) => Promise<Task | null>;
  updateTask: (taskId: string, taskUpdate: Partial<TaskData>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // AI Task Prioritization
  prioritizedSuggestions: PrioritizedTaskSuggestion[];
  isLoadingAi: boolean; // Generic AI loading state
  suggestTaskPrioritization: () => Promise<void>;
  updateTaskPriority: (taskId: string, newPriority: TaskPriority) => Promise<void>;
  dismissSuggestion: (taskId: string) => void;
  clearSuggestions: () => void;
  
  // Social Media Posts
  socialMediaPosts: SocialMediaPost[];
  isLoadingSocialMediaPosts: boolean;
  fetchSocialMediaPosts: () => Promise<void>;
  addSocialMediaPost: (postData: SocialMediaPostData) => Promise<SocialMediaPost | null>;
  updateSocialMediaPost: (postId: string, postUpdate: Partial<SocialMediaPostData>) => Promise<void>;
  deleteSocialMediaPost: (postId: string) => Promise<void>;
  generateSocialMediaPost: (input: GenerateSocialMediaPostInput) => Promise<string | null>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  
  // Social Media Post State
  const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPost[]>([]);
  const [isLoadingSocialMediaPosts, setIsLoadingSocialMediaPosts] = useState(true);

  // Generic AI Loading State
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // --- Task Functions ---
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

  const addTask = async (taskData: TaskData): Promise<Task | null> => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return null;
    }
    setIsLoadingTasks(true); // Or a more specific loading state
    try {
      const newTask = await addTaskService(user.uid, taskData);
      await fetchUserTasks(); // Re-fetch to get the latest list with server-generated timestamps
      toast({ title: "Success", description: "Task added." });
      return newTask;
    } catch (error) {
      console.error("AppDataContext: Failed to add task:", error);
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const updateTask = async (taskId: string, taskUpdate: Partial<TaskData>) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoadingTasks(true);
    try {
      await updateTaskService(user.uid, taskId, taskUpdate);
      await fetchUserTasks();
      toast({ title: "Success", description: "Task updated." });
    } catch (error) {
      console.error("AppDataContext: Failed to update task:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const deleteTask = async (taskId: string) => {
     if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoadingTasks(true);
    try {
      await deleteTaskService(user.uid, taskId);
      await fetchUserTasks();
      toast({ title: "Success", description: "Task deleted." });
    } catch (error) {
      console.error("AppDataContext: Failed to delete task:", error);
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  // --- AI Task Prioritization Functions ---
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
        })),
      };
      const result = await aiPrioritizeTasks(aiInput);
      const suggestions: PrioritizedTaskSuggestion[] = result.prioritizedTasks
        .filter(pt => pt.suggestedPriority !== undefined && pt.id)
        .map((pt: AIPrioritizedTask) => {
          const originalTask = activeTasks.find(t => t.id === pt.id);
          return {
            taskId: pt.id!,
            title: pt.title,
            currentPriority: originalTask?.priority || pt.priority,
            suggestedPriority: pt.suggestedPriority!,
            reason: pt.reasoning || "AI suggested this priority.",
          };
        });
      setPrioritizedSuggestions(suggestions);
      toast({title: suggestions.length > 0 ? "AI Suggestions Ready" : "AI Analysis Complete", description: suggestions.length > 0 ? "Review the suggested task priorities." : "No priority changes were suggested."});
    } catch (error) {
      console.error("AppDataContext: AI prioritization failed:", error);
      toast({ title: "AI Error", description: "Could not get AI priority suggestions.", variant: "destructive" });
      setPrioritizedSuggestions([]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: TaskPriority) => {
    if (!user?.uid) return;
    await updateTask(taskId, { priority: newPriority }); // Reuses the generic updateTask
    setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId)); // Remove suggestion after applying
  };
  
  const dismissSuggestion = (taskId: string) => {
    setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
    toast({ title: "Suggestion Dismissed", description: "The AI suggestion for this task has been dismissed."});
  };

  const clearSuggestions = () => setPrioritizedSuggestions([]);

  // --- Social Media Post Functions ---
  const fetchSocialMediaPosts = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingSocialMediaPosts(true);
      try {
        const posts = await getSocialMediaPosts(user.uid);
        setSocialMediaPosts(posts);
      } catch (error) {
        console.error("AppDataContext: Failed to fetch social media posts:", error);
        toast({ title: "Error", description: "Could not fetch social media posts.", variant: "destructive" });
      } finally {
        setIsLoadingSocialMediaPosts(false);
      }
    } else {
      setSocialMediaPosts([]);
      setIsLoadingSocialMediaPosts(false);
    }
  }, [user, toast]);

   const addSocialMediaPost = async (postData: SocialMediaPostData): Promise<SocialMediaPost | null> => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return null;
    }
    setIsLoadingSocialMediaPosts(true);
    try {
      const newPost = await addPostService(user.uid, postData);
      await fetchSocialMediaPosts();
      toast({ title: "Success", description: "Social media post added." });
      return newPost;
    } catch (error) {
      console.error("AppDataContext: Failed to add social media post:", error);
      toast({ title: "Error", description: "Could not add social media post.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingSocialMediaPosts(false);
    }
  };

  const updateSocialMediaPost = async (postId: string, postUpdate: Partial<SocialMediaPostData>) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoadingSocialMediaPosts(true);
    try {
      await updatePostService(user.uid, postId, postUpdate);
      await fetchSocialMediaPosts();
      toast({ title: "Success", description: "Social media post updated." });
    } catch (error) {
      console.error("AppDataContext: Failed to update social media post:", error);
      toast({ title: "Error", description: "Could not update social media post.", variant: "destructive" });
    } finally {
      setIsLoadingSocialMediaPosts(false);
    }
  };

  const deleteSocialMediaPost = async (postId: string) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoadingSocialMediaPosts(true);
    try {
      await deletePostService(user.uid, postId);
      await fetchSocialMediaPosts();
      toast({ title: "Success", description: "Social media post deleted." });
    } catch (error) {
      console.error("AppDataContext: Failed to delete social media post:", error);
      toast({ title: "Error", description: "Could not delete social media post.", variant: "destructive" });
    } finally {
      setIsLoadingSocialMediaPosts(false);
    }
  };
  
  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    setIsLoadingAi(true);
    try {
      const result = await aiGenerateSocialMediaPost(input);
      return result.postContent;
    } catch (error) {
      console.error("AppDataContext: AI social media post generation failed:", error);
      toast({ title: "AI Error", description: "Could not generate post content.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchSocialMediaPosts();
  }, [fetchSocialMediaPosts]);


  return (
    <AppDataContext.Provider value={{ 
      tasks, 
      isLoadingTasks, 
      fetchTasks: fetchUserTasks,
      addTask,
      updateTask,
      deleteTask,
      prioritizedSuggestions, 
      isLoadingAi, 
      suggestTaskPrioritization, 
      updateTaskPriority,
      dismissSuggestion,
      clearSuggestions,
      socialMediaPosts,
      isLoadingSocialMediaPosts,
      fetchSocialMediaPosts,
      addSocialMediaPost,
      updateSocialMediaPost,
      deleteSocialMediaPost,
      generateSocialMediaPost,
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
