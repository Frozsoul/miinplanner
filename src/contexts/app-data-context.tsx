
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskData, AIInsights, SimpleInsights, TaskStatus, TaskSpace, Workspace, WorkspaceMember } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/task-service';
import { getTaskSpaces, saveTaskSpace as saveTaskSpaceService, loadTasksFromSpace, deleteTaskSpace as deleteTaskSpaceService, applyTasksToUser } from '@/services/task-space-service';
import { getUserWorkspaces, createWorkspace, inviteMemberByEmail, getWorkspaceMembers, removeMember as removeMemberService, deleteWorkspace as deleteWorkspaceService } from '@/services/workspace-service';
import { updateUserProfile } from '@/services/user-service';
import { generateInsights as aiGenerateInsights } from '@/ai/flows/generate-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_TASK_STATUSES } from '@/lib/constants';

interface AppDataContextType {
  isLoadingAppData: boolean;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoadingTasks: boolean;
  fetchTasks: (workspaceId?: string) => Promise<void>;
  addTask: (taskData: TaskData, workspaceId?: string) => Promise<Task | null>;
  updateTask: (taskId: string, taskUpdate: Partial<TaskData>) => Promise<void>;
  updateTaskField: (taskId: string, field: keyof TaskData, value: TaskData[keyof TaskData]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => Promise<void>;
  taskStatuses: TaskStatus[];
  addStatus: (status: TaskStatus) => Promise<void>;
  deleteStatus: (status: TaskStatus) => Promise<void>;
  reorderStatuses: (startIndex: number, endIndex: number) => Promise<void>;

  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceById: (id: string) => void;
  workspaceMembers: WorkspaceMember[];
  fetchWorkspaces: () => Promise<void>;
  addWorkspace: (name: string) => Promise<void>;
  inviteToWorkspace: (email: string) => Promise<void>;
  removeFromWorkspace: (userId: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  // Task Spaces
  taskSpaces: TaskSpace[];
  fetchTaskSpaces: () => Promise<void>;
  saveCurrentTaskSpace: (name: string) => Promise<void>;
  loadTaskSpace: (spaceId: string) => Promise<void>;
  deleteTaskSpace: (spaceId: string) => Promise<void>;
  importTaskSpace: (space: Omit<TaskSpace, 'id'>) => Promise<void>;
  loadTaskSpaceTemplate: (template: Omit<TaskSpace, 'id'>) => Promise<void>;

  // AI
  insights: AIInsights | SimpleInsights | null;
  isLoadingAi: boolean;
  generateInsights: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskSpaces, setTaskSpaces] = useState<TaskSpace[]>([]);
  const [insights, setInsights] = useState<AIInsights | SimpleInsights | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(DEFAULT_TASK_STATUSES);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  const isLoadingAppData = authLoading || isLoadingTasks;

  useEffect(() => {
    if (userProfile?.taskStatuses) {
      setTaskStatuses(userProfile.taskStatuses);
    } else {
      setTaskStatuses(DEFAULT_TASK_STATUSES);
    }
  }, [userProfile]);

  // --- Workspace Logic ---
  const fetchWorkspaces = useCallback(async () => {
    if (!user?.uid) return;
    const ws = await getUserWorkspaces(user.uid);
    setWorkspaces(ws);
    // Don't auto-set currentWorkspace here, let the Teamwork page manage its own context
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (currentWorkspace) {
        const members = await getWorkspaceMembers(currentWorkspace.memberUids);
        setWorkspaceMembers(members);
      } else {
        setWorkspaceMembers([]);
      }
    };
    fetchMembers();
  }, [currentWorkspace]);

  const setCurrentWorkspaceById = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setCurrentWorkspace(ws);
    } else {
      setCurrentWorkspace(null);
    }
  };

  const addWorkspace = async (name: string) => {
    if (!user?.uid) return;
    const newWs = await createWorkspace(user.uid, name);
    setWorkspaces(prev => [...prev, newWs]);
    setCurrentWorkspace(newWs);
    toast({ title: "Workspace created", description: `You are now in ${name}.` });
  };

  const inviteToWorkspace = async (email: string) => {
    if (!currentWorkspace) return;
    try {
      await inviteMemberByEmail(currentWorkspace.id, email);
      toast({ title: "User invited", description: `${email} has been added to the workspace.` });
      fetchWorkspaces(); // Refresh
    } catch (error: any) {
      toast({ title: "Invite failed", description: error.message, variant: "destructive" });
    }
  };

  const removeFromWorkspace = async (userId: string) => {
    if (!currentWorkspace) return;
    await removeMemberService(currentWorkspace.id, userId);
    toast({ title: "Member removed" });
    fetchWorkspaces();
  };

  const deleteWorkspace = async (id: string) => {
    if (!user?.uid) return;
    await deleteWorkspaceService(id);
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(null);
    }
    toast({ title: "Workspace deleted" });
  };

  // --- Task Logic ---
  const fetchTasks = useCallback(async (workspaceId?: string) => {
    if (!user?.uid) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    // Pass the workspaceId to filter personal vs team tasks
    const fetchedTasks = await getTasks(user.uid, workspaceId);
    setTasks(fetchedTasks);
    setIsLoadingTasks(false);
  }, [user]);

  // Initial load: Fetch personal tasks
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: TaskData, workspaceId?: string): Promise<Task | null> => {
    if (!user?.uid) return null;
    
    // If workspaceId is provided (e.g. from Teamwork tab), use it.
    // Otherwise, check if we're currently "in" a workspace context.
    const targetWorkspaceId = workspaceId || currentWorkspace?.id || null;
    
    const payload = { 
      ...taskData, 
      workspaceId: targetWorkspaceId 
    };
    
    const newTask = await addTaskService(user.uid, payload);
    
    // Optimization: Instead of full fetch, we could optimistically update, 
    // but full fetch ensures sorting and other members' updates are synced.
    await fetchTasks(targetWorkspaceId === null ? undefined : targetWorkspaceId);
    return newTask;
  };

  const updateTask = async (taskId: string, taskUpdate: Partial<TaskData>) => {
    if (!user?.uid) return;
    await updateTaskService(user.uid, taskId, taskUpdate);
    // Determine the context to refresh
    const task = tasks.find(t => t.id === taskId);
    await fetchTasks(task?.workspaceId);
  };

  const updateTaskField = async (taskId: string, field: keyof TaskData, value: any) => {
    if (!user?.uid) return;
    await updateTaskService(user.uid, taskId, { [field]: value });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    if (!user?.uid) return;
    await updateTaskService(user.uid, taskId, { status: newStatus });
    const task = tasks.find(t => t.id === taskId);
    await fetchTasks(task?.workspaceId);
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    const task = tasks.find(t => t.id === taskId);
    const contextId = task?.workspaceId;
    await deleteTaskService(user.uid, taskId);
    await fetchTasks(contextId);
  };

  // --- Status Logic ---
  const addStatus = async (status: TaskStatus) => {
    if (!user?.uid) return;
    const newStatuses = [...taskStatuses, status];
    setTaskStatuses(newStatuses);
    await updateUserProfile(user.uid, { taskStatuses: newStatuses });
  };

  const deleteStatus = async (statusToDelete: TaskStatus) => {
    if (!user?.uid) return;
    const newStatuses = taskStatuses.filter(s => s !== statusToDelete);
    setTaskStatuses(newStatuses);
    await updateUserProfile(user.uid, { taskStatuses: newStatuses });
  };

  const reorderStatuses = async (startIndex: number, endIndex: number) => {
    if (!user?.uid) return;
    const newStatuses = [...taskStatuses];
    const [removed] = newStatuses.splice(startIndex, 1);
    newStatuses.splice(endIndex, 0, removed);
    setTaskStatuses(newStatuses);
    await updateUserProfile(user.uid, { taskStatuses: newStatuses });
  };

  // --- Space Logic ---
  const fetchTaskSpaces = useCallback(async () => {
    if (!user?.uid) return;
    const spaces = await getTaskSpaces(user.uid);
    setTaskSpaces(spaces);
  }, [user]);

  const saveCurrentTaskSpace = async (name: string) => {
    if (!user?.uid) return;
    const tasksToSave = tasks.map(({ id, createdAt, updatedAt, userId, ...data }) => data);
    await saveTaskSpaceService(user.uid, name, tasksToSave, taskStatuses);
    fetchTaskSpaces();
  };

  const loadTaskSpace = async (spaceId: string) => {
    if (!user?.uid) return;
    const { taskStatuses: newStatuses } = await loadTasksFromSpace(user.uid, spaceId);
    
    if (newStatuses) {
      setTaskStatuses(newStatuses);
      await updateUserProfile(user.uid, { taskStatuses: newStatuses });
    }
    
    fetchTasks();
  };

  const deleteTaskSpace = async (spaceId: string) => {
    if (!user?.uid) return;
    await deleteTaskSpaceService(user.uid, spaceId);
    fetchTaskSpaces();
  };

  const importTaskSpace = async (space: Omit<TaskSpace, 'id'>) => {
    if (!user?.uid) return;
    
    await applyTasksToUser(user.uid, space.tasks);
    
    if (space.taskStatuses) {
        setTaskStatuses(space.taskStatuses);
        await updateUserProfile(user.uid, { taskStatuses: space.taskStatuses });
    }
    
    fetchTasks();
  };

  const loadTaskSpaceTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    await importTaskSpace(template);
  };

  // --- AI Logic ---
  const generateInsights = async () => {
    if (!user?.uid) return;
    setIsLoadingAi(true);
    try {
      const insightTasks = tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toDate().toISOString(),
        updatedAt: t.updatedAt.toDate().toISOString(),
        dueDate: t.dueDate,
      }));
      
      const aiResult = await aiGenerateInsights({ 
        tasks: insightTasks, 
        currentDate: new Date().toISOString() 
      });
      setInsights({ ...aiResult, type: 'full' });
    } catch (error) {
      // Handled by AI error handling if applicable, or generic catch
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <AppDataContext.Provider value={{
      isLoadingAppData,
      tasks, setTasks, isLoadingTasks, fetchTasks,
      addTask, updateTask, updateTaskField, deleteTask, moveTask,
      taskStatuses, addStatus, deleteStatus, reorderStatuses,
      workspaces, currentWorkspace, setCurrentWorkspaceById, workspaceMembers, fetchWorkspaces, addWorkspace, inviteToWorkspace, removeFromWorkspace, deleteWorkspace,
      taskSpaces, fetchTaskSpaces, saveCurrentTaskSpace, loadTaskSpace, deleteTaskSpace, importTaskSpace, loadTaskSpaceTemplate,
      insights, isLoadingAi, generateInsights,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) throw new Error("useAppData must be used within an AppDataProvider");
  return context;
};
