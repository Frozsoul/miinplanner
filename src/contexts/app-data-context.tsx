
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task, TaskPriority, TaskData, AIInsights, SimpleInsights, InsightTask, TaskStatus, TaskSpace, Workspace, WorkspaceMember } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/task-service';
import { getTaskSpaces, saveTaskSpace as saveTaskSpaceService, loadTasksFromSpace, deleteTaskSpace as deleteTaskSpaceService } from '@/services/task-space-service';
import { getUserWorkspaces, createWorkspace, inviteMemberByEmail, getWorkspaceMembers, removeMember as removeMemberService } from '@/services/workspace-service';
import { updateUserProfile } from '@/services/user-service';
import { generateInsights as aiGenerateInsights, type InsightGenerationInput } from '@/ai/flows/generate-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_TASK_STATUSES } from '@/lib/constants';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface AppDataContextType {
  isLoadingAppData: boolean;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoadingTasks: boolean;
  fetchTasks: () => Promise<void>;
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
  const { user, userProfile, loading: authLoading, fetchUserProfile } = useAuth();
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
    try {
      const ws = await getUserWorkspaces(user.uid);
      setWorkspaces(ws);
      if (ws.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(ws[0]);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    }
  }, [user, currentWorkspace]);

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
      fetchTasks();
    }
  };

  const addWorkspace = async (name: string) => {
    if (!user?.uid) return;
    try {
      const newWs = await createWorkspace(user.uid, name);
      setWorkspaces(prev => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      toast({ title: "Workspace created", description: `You are now in ${name}.` });
    } catch (error) {
      toast({ title: "Error creating workspace", variant: "destructive" });
    }
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
    try {
      await removeMemberService(currentWorkspace.id, userId);
      toast({ title: "Member removed" });
      fetchWorkspaces();
    } catch (error) {
      toast({ title: "Error removing member", variant: "destructive" });
    }
  };

  // --- Task Logic ---
  const fetchTasks = useCallback(async () => {
    if (!user?.uid) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    try {
      const tasksRef = collection(db, 'tasks');
      let q;
      if (currentWorkspace) {
        // Fetch tasks for the workspace
        q = query(
          tasksRef,
          where('workspaceId', '==', currentWorkspace.id),
          orderBy('order', 'asc'),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Fetch personal tasks (no workspaceId)
        q = query(
          tasksRef,
          where('userId', '==', user.uid),
          where('workspaceId', '==', null),
          orderBy('order', 'asc'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      } as Task));
      
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, currentWorkspace]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: TaskData, workspaceId?: string): Promise<Task | null> => {
    if (!user?.uid) return null;
    setIsLoadingTasks(true);
    try {
      const payload = { 
        ...taskData, 
        workspaceId: workspaceId || currentWorkspace?.id || null 
      };
      const newTask = await addTaskService(user.uid, payload);
      await fetchTasks();
      return newTask;
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const updateTask = async (taskId: string, taskUpdate: Partial<TaskData>) => {
    if (!user?.uid) return;
    try {
      await updateTaskService(user.uid, taskId, taskUpdate);
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const updateTaskField = async (taskId: string, field: keyof TaskData, value: any) => {
    if (!user?.uid) return;
    try {
      await updateTaskService(user.uid, taskId, { [field]: value });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    } catch (error) {
      console.error(error);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    if (!user?.uid) return;
    try {
      await updateTaskService(user.uid, taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    try {
      await deleteTaskService(user.uid, taskId);
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
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
    await loadTasksFromSpace(user.uid, spaceId);
    fetchTasks();
  };

  const deleteTaskSpace = async (spaceId: string) => {
    if (!user?.uid) return;
    await deleteTaskSpaceService(user.uid, spaceId);
    fetchTaskSpaces();
  };

  const importTaskSpace = async (space: Omit<TaskSpace, 'id'>) => {
    if (!user?.uid) return;
    const newSpace = await saveTaskSpaceService(user.uid, space.name, space.tasks, space.taskStatuses || taskStatuses);
    await loadTasksFromSpace(user.uid, newSpace.id);
    fetchTasks();
  };

  const loadTaskSpaceTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    if (!user?.uid) return;
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
      const aiResult = await aiGenerateInsights({ tasks: insightTasks, currentDate: new Date().toISOString() });
      setInsights({ ...aiResult, type: 'full' });
    } catch (error) {
      console.error(error);
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
      workspaces, currentWorkspace, setCurrentWorkspaceById, workspaceMembers, fetchWorkspaces, addWorkspace, inviteToWorkspace, removeFromWorkspace,
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
