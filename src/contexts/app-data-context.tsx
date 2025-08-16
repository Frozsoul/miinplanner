
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskPriority, TaskData, SocialMediaPost, SocialMediaPostData, AIInsights, SimpleInsights, InsightTask, TaskStatus, DashboardGreeting, GreetingContext, TaskSpace } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/task-service';
import { getSocialMediaPosts, addSocialMediaPost as addPostService, updateSocialMediaPost as updatePostService, deleteSocialMediaPost as deletePostService } from '@/services/social-media-post-service';
import { getTaskSpaces, saveTaskSpace as saveTaskSpaceService, loadTasksFromSpace, deleteTaskSpace as deleteTaskSpaceService } from '@/services/task-space-service';
import { generateInsights as aiGenerateInsights, type InsightGenerationInput } from '@/ai/flows/generate-insights-flow';
import { generateDashboardGreeting as aiGenerateDashboardGreeting } from '@/ai/flows/generate-dashboard-greeting';
import { generateTaskManagerGreeting as aiGenerateTaskManagerGreeting } from '@/ai/flows/generate-task-manager-greeting';
import { generateCalendarGreeting as aiGenerateCalendarGreeting } from '@/ai/flows/generate-calendar-greeting';

import { generateSocialMediaPost as aiGenerateSocialMediaPost, type GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from '@/hooks/use-toast';
import { TASK_STATUSES } from '@/lib/constants';

interface AppDataContextType {
  // Tasks
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoadingTasks: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: TaskData) => Promise<Task | null>;
  updateTask: (taskId: string, taskUpdate: Partial<TaskData>) => Promise<void>;
  updateTaskField: (taskId: string, field: keyof TaskData, value: TaskData[keyof TaskData]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => Promise<void>;

  // Task Spaces
  taskSpaces: TaskSpace[];
  fetchTaskSpaces: () => Promise<void>;
  saveCurrentTaskSpace: (name: string) => Promise<void>;
  loadTaskSpace: (spaceId: string) => Promise<void>;
  deleteTaskSpace: (spaceId: string) => Promise<void>;
  importTaskSpace: (space: TaskSpace) => Promise<void>;

  // AI Insights
  insights: AIInsights | SimpleInsights | null;
  greetings: Partial<Record<GreetingContext, DashboardGreeting>>;
  isLoadingAi: boolean;
  isLoadingGreeting: Partial<Record<GreetingContext, boolean>>;
  generateInsights: () => Promise<void>;
  fetchGreeting: (context: GreetingContext) => Promise<void>;
  
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
  
  // Task Spaces State
  const [taskSpaces, setTaskSpaces] = useState<TaskSpace[]>([]);

  // AI Insights State
  const [insights, setInsights] = useState<AIInsights | SimpleInsights | null>(null);
  const [greetings, setGreetings] = useState<Partial<Record<GreetingContext, DashboardGreeting>>>({});
  const [isLoadingGreeting, setIsLoadingGreeting] = useState<Partial<Record<GreetingContext, boolean>>>({});


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

  const updateTaskField = async (taskId: string, field: keyof TaskData, value: TaskData[keyof TaskData] | undefined) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    const originalTasks = [...tasks];
    
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, [field]: value } as Task : task
    ));

    try {
      const payload = { [field]: value };
      await updateTaskService(user.uid, taskId, payload);
    } catch (error) {
      console.error(`AppDataContext: Failed to update task field ${field}:`, error);
      toast({ title: "Error", description: `Could not update task ${field}.`, variant: "destructive" });
      setTasks(originalTasks); // Revert on failure
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    if (!user?.uid) {
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
        return;
    }

    setTasks(prevTasks => {
        const taskToMove = prevTasks.find(t => t.id === taskId);
        if (!taskToMove) return prevTasks;

        const sourceTasks = prevTasks.filter(t => t.id !== taskId);
        const newTasks = [...sourceTasks];

        const updatedTask = { ...taskToMove, status: newStatus };
        newTasks.splice(newIndex, 0, updatedTask);

        return newTasks;
    });

    try {
        await updateTaskService(user.uid, taskId, { status: newStatus });
    } catch (error) {
        console.error("AppDataContext: Failed to move task:", error);
        toast({ title: "Error", description: "Could not move task. Reverting.", variant: "destructive" });
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

  // --- Task Spaces Functions ---
  const fetchTaskSpaces = useCallback(async () => {
    if (!user?.uid) {
      setTaskSpaces([]);
      return;
    }
    try {
      const spaces = await getTaskSpaces(user.uid);
      setTaskSpaces(spaces);
    } catch (error) {
      console.error("AppDataContext: Failed to fetch task spaces:", error);
      toast({ title: "Error", description: "Could not fetch task spaces.", variant: "destructive" });
    }
  }, [user, toast]);

  const saveCurrentTaskSpace = async (name: string) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      const tasksToSave = tasks.map(({ id, createdAt, updatedAt, userId, ...taskData }) => taskData);
      await saveTaskSpaceService(user.uid, name, tasksToSave);
      await fetchTaskSpaces();
      toast({ title: "Success", description: `Task space "${name}" saved.` });
    } catch (error) {
      console.error("AppDataContext: Failed to save task space:", error);
      toast({ title: "Error", description: "Could not save task space.", variant: "destructive" });
    }
  };

  const loadTaskSpace = async (spaceId: string) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      await loadTasksFromSpace(user.uid, spaceId);
      await fetchUserTasks(); // This reloads the tasks into the main state
      toast({ title: "Success", description: "Task space loaded." });
    } catch (error) {
      console.error("AppDataContext: Failed to load task space:", error);
      toast({ title: "Error", description: "Could not load task space.", variant: "destructive" });
    }
  };

  const importTaskSpace = async (space: TaskSpace) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      const newSpace = await saveTaskSpaceService(user.uid, space.name, space.tasks);
      await loadTasksFromSpace(user.uid, newSpace.id);
      await fetchUserTasks();
      await fetchTaskSpaces();
      toast({ title: "Success", description: `Imported and loaded "${space.name}".` });
    } catch (error) {
      console.error("AppDataContext: Failed to import task space:", error);
      toast({ title: "Error", description: "Could not import task space.", variant: "destructive" });
    }
  };

  const deleteTaskSpace = async (spaceId: string) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      await deleteTaskSpaceService(user.uid, spaceId);
      await fetchTaskSpaces();
      toast({ title: "Success", description: "Task space deleted." });
    } catch (error) {
      console.error("AppDataContext: Failed to delete task space:", error);
      toast({ title: "Error", description: "Could not delete task space.", variant: "destructive" });
    }
  };


  // --- AI Insights Functions ---
  const generateInsights = async () => {
    setIsLoadingAi(true);
    setInsights(null);

    const validStatuses = new Set(TASK_STATUSES);

    const validTasksForAnalysis = tasks.filter(task => 
      task.createdAt && typeof task.createdAt.toDate === 'function' &&
      task.updatedAt && typeof task.updatedAt.toDate === 'function' &&
      validStatuses.has(task.status)
    );
    
    if (validTasksForAnalysis.length < MIN_TASKS_FOR_AI) {
      const simpleReport: SimpleInsights = {
        type: 'simple',
        totalTasks: tasks.filter(t => !t.archived).length,
        tasksToDo: tasks.filter(t => !t.archived && (t.status === 'To Do' || t.status === 'In Progress')).length,
        highPriorityTasks: tasks.filter(t => !t.archived && (t.priority === 'High' || t.priority === 'Urgent')).length,
        message: `You currently have ${validTasksForAnalysis.length} tasks with complete data. Reach ${MIN_TASKS_FOR_AI} to unlock advanced AI analysis, including productivity scores and proactive suggestions!`,
      };
      setInsights(simpleReport);
      toast({ title: "Basic Insights Generated", description: "Add more tasks to unlock the full power of AI." });
      setIsLoadingAi(false);
      return;
    }

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
  
  const fetchGreeting = useCallback(async (context: GreetingContext) => {
    if (tasks.length === 0) return;

    setIsLoadingGreeting(prev => ({ ...prev, [context]: true }));
    const today = new Date().toDateString();

    if (greetings[context]?.date === today) {
      setIsLoadingGreeting(prev => ({ ...prev, [context]: false }));
      return;
    }

    const insightTasks: InsightTask[] = tasks.filter(t => !t.archived).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toDate().toISOString(),
      updatedAt: (t.updatedAt || t.createdAt).toDate().toISOString(),
      dueDate: t.dueDate,
    }));

    if (insightTasks.length === 0) {
        setGreetings(prev => ({
            ...prev,
            [context]: { greeting: "Welcome! Add some tasks to get started.", date: today }
        }));
        setIsLoadingGreeting(prev => ({ ...prev, [context]: false }));
        return;
    }
    
    const input: InsightGenerationInput = {
      tasks: insightTasks,
      currentDate: new Date().toISOString(),
    };

    try {
      let greetingText = "";
      switch (context) {
        case 'dashboard':
          greetingText = await aiGenerateDashboardGreeting(input);
          break;
        case 'tasks':
          greetingText = await aiGenerateTaskManagerGreeting(input);
          break;
        case 'calendar':
          greetingText = await aiGenerateCalendarGreeting(input);
          break;
        default:
          greetingText = "Welcome back! Ready to tackle your day?";
      }
      setGreetings(prev => ({ ...prev, [context]: { greeting: greetingText, date: today } }));
    } catch (error) {
      console.error(`AppDataContext: Failed to fetch ${context} greeting:`, error);
      setGreetings(prev => ({
          ...prev,
          [context]: { greeting: "Welcome back! Ready to tackle your day?", date: today }
      }));
    } finally {
      setIsLoadingGreeting(prev => ({ ...prev, [context]: false }));
    }
  }, [tasks, greetings]);


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
      setTasks,
      isLoadingTasks, 
      fetchTasks: fetchUserTasks,
      addTask,
      updateTask,
      updateTaskField,
      deleteTask,
      moveTask,
      taskSpaces,
      fetchTaskSpaces,
      saveCurrentTaskSpace,
      loadTaskSpace,
      deleteTaskSpace,
      importTaskSpace,
      insights, 
      greetings,
      isLoadingAi, 
      isLoadingGreeting,
      generateInsights,
      fetchGreeting,
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
