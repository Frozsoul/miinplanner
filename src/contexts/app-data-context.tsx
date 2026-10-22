
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { Task, TaskData, AIInsights, SimpleInsights, TaskStatus, TaskSpace, Workspace, WorkspaceMember } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getTasks, addTask as addTaskService, addTasksBulk as addTasksBulkService, updateTask as updateTaskService, deleteTask as deleteTaskService, syncCompletion } from '@/services/task-service';
import { getTaskSpaces, saveTaskSpace as saveTaskSpaceService, loadTasksFromSpace, deleteTaskSpace as deleteTaskSpaceService, applyTasksToUser, backupPersonalBoard } from '@/services/task-space-service';
import { getUserWorkspaces, createWorkspace, inviteMemberByEmail, getWorkspaceMembers, removeMember as removeMemberService, deleteWorkspace as deleteWorkspaceService, updateWorkspaceStatuses } from '@/services/workspace-service';
import { resolveDoneStatus, isFinished, completionFields } from '@/lib/task-status';
import { updateUserProfile } from '@/services/user-service';
import { generateInsights as aiGenerateInsights } from '@/ai/flows/generate-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
import { trackFirstTask } from '@/lib/analytics';
import { DEFAULT_TASK_STATUSES, NEW_BOARD_STATUSES } from '@/lib/constants';
import { isSlip, slipFields, openTasksDueOn, BUSY_DAY_TASKS } from '@/lib/slips';
import { ToastAction } from '@/components/ui/toast';

interface AppDataContextType {
  isLoadingAppData: boolean;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoadingTasks: boolean;
  fetchTasks: (workspaceId?: string) => Promise<void>;
  addTask: (taskData: TaskData, workspaceId?: string) => Promise<Task | null>;
  addTasks: (tasksData: TaskData[]) => Promise<number>;
  updateTask: (taskId: string, taskUpdate: Partial<TaskData>) => Promise<void>;
  updateTaskField: (taskId: string, field: keyof TaskData, value: TaskData[keyof TaskData]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => Promise<void>;
  taskStatuses: TaskStatus[];
  addStatus: (status: TaskStatus) => Promise<void>;
  deleteStatus: (status: TaskStatus) => Promise<void>;
  reorderStatuses: (startIndex: number, endIndex: number) => Promise<void>;
  /** The status that means finished on the current board. Use this instead of checking for "Done". */
  doneStatus: TaskStatus | null;
  setDoneStatus: (status: TaskStatus) => Promise<void>;
  isTaskDone: (task: Pick<Task, 'status'>) => boolean;

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
  saveCurrentTaskSpace: (name: string) => Promise<boolean>;
  loadTaskSpace: (spaceId: string) => Promise<void>;
  deleteTaskSpace: (spaceId: string) => Promise<void>;
  importTaskSpace: (space: Omit<TaskSpace, 'id'>) => Promise<void>;
  loadTaskSpaceTemplate: (template: Omit<TaskSpace, 'id'>) => Promise<void>;

  // AI & Data Insights
  insights: AIInsights | null;
  simpleInsights: SimpleInsights;
  completionHistory: { date: string; completed: number }[];
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
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(DEFAULT_TASK_STATUSES);
  const [storedDoneStatus, setStoredDoneStatus] = useState<TaskStatus | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  const isLoadingAppData = authLoading || isLoadingTasks;

  // Sync taskStatuses based on active context (Workspace or Personal Profile)
  useEffect(() => {
    if (currentWorkspace) {
      setTaskStatuses(currentWorkspace.taskStatuses || DEFAULT_TASK_STATUSES);
      setStoredDoneStatus(currentWorkspace.doneStatus || null);
    } else if (userProfile?.taskStatuses) {
      setTaskStatuses(userProfile.taskStatuses);
      setStoredDoneStatus(userProfile.doneStatus || null);
    } else {
      setTaskStatuses(DEFAULT_TASK_STATUSES);
      setStoredDoneStatus(userProfile?.doneStatus || null);
    }
  }, [currentWorkspace, userProfile]);

  // The one rule for "finished" on this board. See src/lib/task-status.ts.
  const doneStatus = useMemo(() => resolveDoneStatus(taskStatuses, storedDoneStatus), [taskStatuses, storedDoneStatus]);
  const isTaskDone = useCallback((task: Pick<Task, 'status'>) => isFinished(task.status, doneStatus), [doneStatus]);

  // Data Insights: Simple metrics calculated from local state
  const simpleInsights = useMemo((): SimpleInsights => {
    const total = tasks.length;
    const todo = tasks.filter(t => !isTaskDone(t) && !t.archived).length;
    const urgent = tasks.filter(t => (t.priority === 'Urgent' || t.priority === 'High') && !isTaskDone(t) && !t.archived).length;
    
    let message = "Start completing tasks to unlock more detailed insights.";
    if (total > 5) message = "You've got a good list going! Use the AI generation for a deeper analysis.";
    if (total > 10 && todo < total / 2) message = "Great momentum! You've completed more than half your tasks.";

    return {
      type: 'simple',
      totalTasks: total,
      tasksToDo: todo,
      highPriorityTasks: urgent,
      message
    };
  }, [tasks, isTaskDone]);

  // Completion History for the last 7 days
  const completionHistory = useMemo(() => {
    const history: { date: string; completed: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const count = tasks.filter(t => {
        if (!isTaskDone(t) || t.archived) return false;
        const finished = t.completedAt ? new Date(t.completedAt) : (t.updatedAt?.toDate ? t.updatedAt.toDate() : null);
        if (!finished) return false;
        return finished.toDateString() === d.toDateString();
      }).length;
      
      history.push({ date: dateStr, completed: count });
    }
    return history;
  }, [tasks, isTaskDone]);

  // --- Workspace Logic ---
  const fetchWorkspaces = useCallback(async () => {
    if (!user?.uid) return;
    const ws = await getUserWorkspaces(user.uid);
    setWorkspaces(ws);
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (currentWorkspace && user) {
        const idToken = await user.getIdToken();
        const members = await getWorkspaceMembers(idToken, currentWorkspace.id);
        setWorkspaceMembers(members);
      } else {
        setWorkspaceMembers([]);
      }
    };
    fetchMembers();
  }, [currentWorkspace, user]);

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
    // Every new team board starts with the same three statuses; the team edits its own list in Settings.
    const newWs = await createWorkspace(user.uid, name, NEW_BOARD_STATUSES);
    setWorkspaces(prev => [...prev, newWs]);
    setCurrentWorkspace(newWs);
    toast({ title: "Workspace created", description: `You are now in ${name}.` });
  };

  const inviteToWorkspace = async (email: string) => {
    if (!currentWorkspace || !user) return;
    try {
      const idToken = await user.getIdToken();
      const member = await inviteMemberByEmail(idToken, currentWorkspace.id, email);
      setWorkspaceMembers(prev => (prev.some(m => m.uid === member.uid) ? prev : [...prev, member]));
      toast({ title: "User invited", description: `${email} has been added to the workspace.` });
      fetchWorkspaces(); 
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
    const fetchedTasks = await getTasks(user.uid, workspaceId);
    setTasks(fetchedTasks);
    setIsLoadingTasks(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: TaskData, workspaceId?: string): Promise<Task | null> => {
    if (!user?.uid) return null;
    const targetWorkspaceId = workspaceId || currentWorkspace?.id || null;
    const payload = { ...taskData, workspaceId: targetWorkspaceId, completed: isFinished(taskData.status, doneStatus) };
    const newTask = await addTaskService(user.uid, payload);
    trackFirstTask(user.uid, tasks.length === 0, 'manual');
    await fetchTasks(targetWorkspaceId === null ? undefined : targetWorkspaceId);
    return newTask;
  };

  // Adds tasks to the current board (personal or active workspace) without touching existing ones.
  const addTasks = async (tasksData: TaskData[]): Promise<number> => {
    if (!user?.uid) return 0;
    const targetWorkspaceId = currentWorkspace?.id || null;
    const count = await addTasksBulkService(
      user.uid,
      tasksData.map(t => ({ ...t, workspaceId: targetWorkspaceId ?? undefined, completed: isFinished(t.status, doneStatus) })),
    );
    if (count > 0) trackFirstTask(user.uid, tasks.length === 0, 'plan_import');
    await fetchTasks(targetWorkspaceId === null ? undefined : targetWorkspaceId);
    return count;
  };

  // A small reward when a task moves into the done column. Runs only on a real change.
  const celebrateIfDone = (taskId: string, newStatus: unknown) => {
    if (typeof newStatus !== 'string') return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || isFinished(task.status, doneStatus) || !isFinished(newStatus, doneStatus)) return;
    celebrate();
    const left = tasks.filter(t => t.id !== taskId && !t.archived && !isFinished(t.status, doneStatus)).length;
    toast({
      title: "Task done",
      description: left === 0 ? "Board clear. Nice work." : `${left} ${left === 1 ? "task" : "tasks"} to go.`,
    });
  };

  // Any status change also writes `completed` and `completedAt`, so they always match the status.
  // Skipped when the status didn't actually change, so editing a finished task keeps its finish date.
  const withCompletion = <T extends { status?: TaskStatus }>(update: T, previousStatus?: TaskStatus) =>
    typeof update.status === 'string' && update.status !== previousStatus
      ? { ...update, ...completionFields(update.status, doneStatus) }
      : update;

  // Pushed dates: moving an already-due task to a later day counts as a slip (rule in src/lib/slips.ts).
  // Returns the extra fields to write, or {} when it's a plain date change.
  const slipUpdate = (previous: Task | undefined, newDueDate: unknown) => {
    if (!previous || typeof newDueDate !== 'string') return {};
    return isSlip(previous, newDueDate, isTaskDone) ? slipFields(previous) : {};
  };

  // Toast after a slip, with a one-tap undo for date fixes, and a note when the new day is busy.
  const announceSlip = (previous: Task, newDueDate: string) => {
    const day = new Date(newDueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const busy = openTasksDueOn(tasks, newDueDate, isTaskDone, previous.id) + 1;
    const undo = async () => {
      if (!user?.uid) return;
      const restore = {
        slipCount: previous.slipCount || 0,
        lastSlipAt: (previous.lastSlipAt ?? null) as unknown as string | undefined,
      };
      await updateTaskService(user.uid, previous.id, restore);
      setTasks(prev => prev.map(t => t.id === previous.id ? { ...t, slipCount: restore.slipCount, lastSlipAt: previous.lastSlipAt } : t));
    };
    toast({
      title: `Moved to ${day}. Counted as a slip.`,
      description: busy >= BUSY_DAY_TASKS
        ? `${day} now has ${busy} open tasks. Consider moving or handing off one.`
        : "It was due already. Your companion will notice if it keeps moving.",
      action: <ToastAction altText="It was a date fix, don't count it" onClick={undo}>It was a date fix</ToastAction>,
    });
  };

  const updateTask = async (taskId: string, taskUpdate: Partial<TaskData>) => {
    if (!user?.uid) return;
    const { completedAt: _ignored, slipCount: _s, lastSlipAt: _l, firstDueDate: _f, ...rest } = taskUpdate;
    const previous = tasks.find(t => t.id === taskId);
    const slip = slipUpdate(previous, rest.dueDate);
    await updateTaskService(user.uid, taskId, { ...withCompletion(rest, previous?.status), ...slip });
    if (previous && 'slipCount' in slip && rest.dueDate) announceSlip(previous, rest.dueDate);
    if ('status' in taskUpdate) celebrateIfDone(taskId, taskUpdate.status);
    const task = tasks.find(t => t.id === taskId);
    await fetchTasks(task?.workspaceId);
  };

  const updateTaskField = async (taskId: string, field: keyof TaskData, value: any) => {
    if (!user?.uid) return;
    if (field === 'status' && typeof value === 'string' && value !== tasks.find(t => t.id === taskId)?.status) {
      const fields = completionFields(value, doneStatus);
      await updateTaskService(user.uid, taskId, { status: value, ...fields });
      celebrateIfDone(taskId, value);
      setTasks(prev => prev.map(t => t.id === taskId
        ? { ...t, status: value, completed: fields.completed, completedAt: fields.completedAt ? fields.completedAt.toISOString() : undefined }
        : t));
      return;
    }
    const previous = tasks.find(t => t.id === taskId);
    const slip = field === 'dueDate' ? slipUpdate(previous, value) : {};
    await updateTaskService(user.uid, taskId, { [field]: value, ...slip });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value, ...slip } : t));
    if (previous && 'slipCount' in slip && typeof value === 'string') announceSlip(previous, value);
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    if (!user?.uid) return;
    const task = tasks.find(t => t.id === taskId);
    await updateTaskService(user.uid, taskId, withCompletion({ status: newStatus }, task?.status));
    celebrateIfDone(taskId, newStatus);
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
  // Saves the status list and the finished status together. Every edit also pins the current
  // finished status, so adding or reordering statuses never changes which tasks count as done.
  const saveStatuses = async (newStatuses: TaskStatus[], newDone: TaskStatus | null) => {
    if (!user?.uid) return;
    setTaskStatuses(newStatuses);
    setStoredDoneStatus(newDone);
    const fields = newDone ? { taskStatuses: newStatuses, doneStatus: newDone } : { taskStatuses: newStatuses };
    if (currentWorkspace) {
      await updateWorkspaceStatuses(currentWorkspace.id, newStatuses, newDone);
      setWorkspaces(prev => prev.map(ws => ws.id === currentWorkspace.id ? { ...ws, ...fields } : ws));
      setCurrentWorkspace(prev => prev ? { ...prev, ...fields } : null);
    } else {
      await updateUserProfile(user.uid, fields);
    }
  };

  const addStatus = async (status: TaskStatus) => {
    await saveStatuses([...taskStatuses, status], doneStatus);
  };

  const deleteStatus = async (statusToDelete: TaskStatus) => {
    if (statusToDelete === doneStatus) {
      toast({
        title: "Pick another finished status first",
        description: `"${statusToDelete}" is the status that marks tasks as finished. Mark a different status as finished, then delete this one.`,
        variant: "destructive",
      });
      return;
    }
    await saveStatuses(taskStatuses.filter(s => s !== statusToDelete), doneStatus);
  };

  const reorderStatuses = async (startIndex: number, endIndex: number) => {
    const newStatuses = [...taskStatuses];
    const [removed] = newStatuses.splice(startIndex, 1);
    newStatuses.splice(endIndex, 0, removed);
    await saveStatuses(newStatuses, doneStatus);
  };

  const setDoneStatus = async (status: TaskStatus) => {
    if (!taskStatuses.includes(status) || status === doneStatus) return;
    await saveStatuses(taskStatuses, status);
    toast({ title: "Finished status updated", description: `Tasks in "${status}" now count as finished.` });
  };

  // Keep the stored `completed` flag in line with each task's status. Runs once per board and
  // finished status, and only writes `completed` and `completedAt` on tasks that disagree.
  const syncedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.uid || isLoadingTasks || !doneStatus || tasks.length === 0) return;
    const boardId = currentWorkspace?.id;
    const onThisBoard = tasks.filter(t => (boardId ? t.workspaceId === boardId : !t.workspaceId));
    if (onThisBoard.length === 0) return;
    const key = `${boardId || 'personal'}:${doneStatus}:${onThisBoard.length}`;
    if (syncedKey.current === key) return;
    const mismatched = onThisBoard.filter(t => t.completed !== isFinished(t.status, doneStatus));
    syncedKey.current = key;
    if (mismatched.length === 0) return;
    const updates = mismatched.map(t => {
      const done = isFinished(t.status, doneStatus);
      return { id: t.id, completed: done, completedAt: done ? (t.updatedAt ?? null) : null };
    });
    syncCompletion(updates)
      .then(() => {
        const byId = new Map(updates.map(u => [u.id, u]));
        setTasks(prev => prev.map(t => {
          const u = byId.get(t.id);
          if (!u) return t;
          return { ...t, completed: u.completed, completedAt: u.completed && t.updatedAt?.toDate ? t.updatedAt.toDate().toISOString() : undefined };
        }));
      })
      .catch(err => console.error("Couldn't sync finished flags:", err));
  }, [user, isLoadingTasks, tasks, doneStatus, currentWorkspace]);

  // --- Space Logic ---
  const fetchTaskSpaces = useCallback(async () => {
    if (!user?.uid) return;
    const spaces = await getTaskSpaces(user.uid);
    setTaskSpaces(spaces);
  }, [user]);

  const saveCurrentTaskSpace = async (name: string) => {
    if (!user?.uid) return false;
    const tasksToSave = tasks.map(({ id, createdAt, updatedAt, userId, ...data }) => data);
    try {
      await saveTaskSpaceService(user.uid, name, tasksToSave, taskStatuses);
      toast({ title: "Board saved", description: `"${name}" is in your saved spaces.` });
      fetchTaskSpaces();
      return true;
    } catch (err) {
      console.error("Error saving task space:", err);
      toast({ title: "Could not save the board", description: "Nothing was saved. Please try again.", variant: "destructive" });
      return false;
    }
  };

  // Every replace of the personal board is preceded by an automatic backup to Saved Spaces.
  // If the backup fails, nothing is replaced.
  const backupBeforeReplace = async (incomingName: string): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      const stamp = new Date().toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const count = await backupPersonalBoard(user.uid, `Backup before "${incomingName}" (${stamp})`, userProfile?.taskStatuses || DEFAULT_TASK_STATUSES);
      if (count > 0) await fetchTaskSpaces();
      return true;
    } catch (err) {
      console.error("Backup before replace failed:", err);
      toast({
        title: "Nothing was changed",
        description: "We couldn't back up your current board, so we stopped before replacing it. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const afterReplace = (name: string) => {
    toast({
      title: `Loaded "${name}"`,
      description: "Your previous personal board was saved to Saved Spaces. Workspace tasks were not touched.",
    });
  };

  const replaceFailed = (err: unknown) => {
    console.error("Replacing the board failed:", err);
    toast({
      title: "Couldn't load that board",
      description: "Your previous board is in Saved Spaces if anything looks wrong.",
      variant: "destructive",
    });
  };

  const loadTaskSpace = async (spaceId: string) => {
    if (!user?.uid) return;
    const spaceName = taskSpaces.find(s => s.id === spaceId)?.name || "saved space";
    if (!(await backupBeforeReplace(spaceName))) return;
    try {
      const { taskStatuses: newStatuses } = await loadTasksFromSpace(user.uid, spaceId);
      if (newStatuses) {
        setTaskStatuses(newStatuses);
        await updateUserProfile(user.uid, { taskStatuses: newStatuses });
      }
      afterReplace(spaceName);
    } catch (err) {
      replaceFailed(err);
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
    if (!(await backupBeforeReplace(space.name))) return;
    try {
      await applyTasksToUser(user.uid, space.tasks);
      if (space.taskStatuses) {
          setTaskStatuses(space.taskStatuses);
          await updateUserProfile(user.uid, { taskStatuses: space.taskStatuses });
      }
      afterReplace(space.name);
    } catch (err) {
      replaceFailed(err);
    }
    fetchTasks();
  };

  const loadTaskSpaceTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    await importTaskSpace(template);
  };

  // --- AI Logic ---
  const generateInsights = async () => {
    if (!user?.uid) return;
    if (tasks.length === 0) {
        toast({ title: "No tasks", description: "Add some tasks before generating AI insights.", variant: "destructive" });
        return;
    }

    setIsLoadingAi(true);
    try {
      const insightTasks = tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toDate ? t.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: t.updatedAt.toDate ? t.updatedAt.toDate().toISOString() : new Date().toISOString(),
        dueDate: t.dueDate,
        completed: isTaskDone(t),
      }));
      
      const idToken = await user.getIdToken();
      const aiResult = await aiGenerateInsights(idToken, {
        tasks: insightTasks,
        currentDate: new Date().toISOString()
      });
      if (!aiResult.ok) {
        toast({ title: "AI analysis unavailable", description: aiResult.message, variant: "destructive" });
        return;
      }
      setInsights({ ...aiResult.data, type: 'full' });
    } catch (error: any) {
        console.error("AI Insight Generation Failed:", error);
        toast({ 
            title: "AI Analysis Unavailable", 
            description: "We couldn't connect to the AI service. Please check your internet or try again later.",
            variant: "destructive" 
        });
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <AppDataContext.Provider value={{
      isLoadingAppData,
      tasks, setTasks, isLoadingTasks, fetchTasks,
      addTask, addTasks, updateTask, updateTaskField, deleteTask, moveTask,
      taskStatuses, addStatus, deleteStatus, reorderStatuses, doneStatus, setDoneStatus, isTaskDone,
      workspaces, currentWorkspace, setCurrentWorkspaceById, workspaceMembers, fetchWorkspaces, addWorkspace, inviteToWorkspace, removeFromWorkspace, deleteWorkspace,
      taskSpaces, fetchTaskSpaces, saveCurrentTaskSpace, loadTaskSpace, deleteTaskSpace, importTaskSpace, loadTaskSpaceTemplate,
      insights, simpleInsights, completionHistory, isLoadingAi, generateInsights,
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
