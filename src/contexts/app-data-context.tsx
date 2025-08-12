
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskPriority, TaskData, SocialMediaPost, SocialMediaPostData, AIInsights, SimpleInsights, InsightTask, TaskStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/task-service';
import { getSocialMediaPosts, addSocialMediaPost as addPostService, updateSocialMediaPost as updatePostService, deleteSocialMediaPost as deletePostService } from '@/services/social-media-post-service';
import { generateInsights as aiGenerateInsights, type InsightGenerationInput } from '@/ai/flows/generate-insights-flow';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, type GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from '@/hooks/use-toast';
import { TASK_STATUSES } from '@/lib/constants';

interface AppDataContextType {
  // Tasks
  tasks: Task[];
  isLoadingTasks: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: TaskData) => Promise<Task | null>;
  updateTask: (taskId: string, taskUpdate: Partial<TaskData>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => Promise<void>;


  // AI Insights
  insights: AIInsights | SimpleInsights | null;
  isLoadingAi: boolean;
  generateInsights: () => Promise<void>;
  
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

const MIN_TASKS_FOR_AI = 5; // Minimum number of valid tasks to trigger full AI insights

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  // AI Insights State
  const [insights, setInsights] = useState<AIInsights | SimpleInsights | null>(null);

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
        // Fetches all tasks, including archived ones
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
    setIsLoadingTasks(true);
    try {
      const newTask = await addTaskService(user.uid, taskData);
      await fetchUserTasks(); 
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
    // No full loading state for quick updates like archiving
    const originalTasks = tasks;
    // Optimistic update
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, ...taskUpdate } as Task : task
    ));
    try {
      await updateTaskService(user.uid, taskId, taskUpdate);
      // Optional: re-fetch for consistency, but optimistic update handles UI
      await fetchUserTasks();
    } catch (error) {
      console.error("AppDataContext: Failed to update task:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
      setTasks(originalTasks); // Revert on error
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }

    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // Optimistic UI update
    const updatedTasks = Array.from(tasks);
    const [reorderedItem] = updatedTasks.splice(updatedTasks.indexOf(taskToMove), 1);
    reorderedItem.status = newStatus;
    
    const tasksInNewColumn = updatedTasks.filter(t => t.status === newStatus);
    const insertAtIndex = updatedTasks.indexOf(tasksInNewColumn[newIndex]);

    if (insertAtIndex !== -1) {
        updatedTasks.splice(insertAtIndex, 0, reorderedItem);
    } else {
        // If new column is empty, find where to insert based on TASK_STATUSES order
        let targetIndex = 0;
        const statusOrder = TASK_STATUSES;
        const newStatusIndex = statusOrder.indexOf(newStatus);

        for (let i = newStatusIndex + 1; i < statusOrder.length; i++) {
            const nextStatus = statusOrder[i];
            const firstOfNext = updatedTasks.findIndex(t => t.status === nextStatus);
            if (firstOfNext !== -1) {
                targetIndex = firstOfNext;
                break;
            }
        }
        if (targetIndex === 0) { // If it's the last column or others are empty
             updatedTasks.push(reorderedItem);
        } else {
            updatedTasks.splice(targetIndex, 0, reorderedItem);
        }
    }

    setTasks(updatedTasks);

    try {
      await updateTaskService(user.uid, taskId, { status: newStatus });
      // Don't toast for drag-and-drop, it's noisy
    } catch (error) {
      console.error("AppDataContext: Failed to move task:", error);
      toast({ title: "Error", description: "Could not move task. Reverting.", variant: "destructive" });
      // Revert on error by re-fetching
      fetchUserTasks(); 
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
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  // --- AI Insights Functions ---
  const generateInsights = async () => {
    setIsLoadingAi(true);
    setInsights(null);

    const validStatuses = new Set(TASK_STATUSES);

    // Filter for tasks that have the necessary data for insights
    // AI can analyze archived tasks, so we don't filter them out here.
    const validTasksForAnalysis = tasks.filter(task => 
      task.createdAt && typeof task.createdAt.toDate === 'function' &&
      task.updatedAt && typeof task.updatedAt.toDate === 'function' &&
      validStatuses.has(task.status)
    );
    
    if (validTasksForAnalysis.length < MIN_TASKS_FOR_AI) {
      // Generate simple, local insights
      const simpleReport: SimpleInsights = {
        type: 'simple',
        totalTasks: tasks.filter(t => !t.archived).length, // Only count active tasks for this metric
        tasksToDo: tasks.filter(t => !t.archived && (t.status === 'To Do' || t.status === 'In Progress')).length,
        highPriorityTasks: tasks.filter(t => !t.archived && (t.priority === 'High' || t.priority === 'Urgent')).length,
        message: `You currently have ${validTasksForAnalysis.length} tasks with complete data. Reach ${MIN_TASKS_FOR_AI} to unlock advanced AI analysis, including productivity scores and proactive suggestions!`,
      };
      setInsights(simpleReport);
      toast({ title: "Basic Insights Generated", description: "Add more tasks to unlock the full power of AI." });
      setIsLoadingAi(false);
      return;
    }

    // Prepare data for the full AI flow
    const insightTasks: InsightTask[] = validTasksForAnalysis.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toDate().toISOString(),
      updatedAt: (t.updatedAt || t.createdAt).toDate().toISOString(),
      dueDate: t.dueDate,
    }));

    try {
      const input: InsightGenerationInput = {
        tasks: insightTasks,
        currentDate: new Date().toISOString(),
      };
      const aiResult = await aiGenerateInsights(input);
      setInsights({ ...aiResult, type: 'full' });
      toast({ title: "AI Insights Generated", description: "Your productivity report is ready." });
    } catch (error) {
      console.error("AppDataContext: AI insight generation failed:", error);
      toast({ title: "AI Error", description: "Could not generate insights. Please try again.", variant: "destructive" });
      setInsights(null);
    } finally {
      setIsLoadingAi(false);
    }
  };

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
      moveTask,
      insights, 
      isLoadingAi, 
      generateInsights,
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
