import { db } from '@/lib/firebase';
import type { Task, TaskData, TaskStatus, TaskPriority } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const TASK_COLLECTION = 'tasks';

// Helper to convert Firestore doc to Task object
export const taskFromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = snapshot.data();
  
  // Safe date conversion helper
  const toIsoString = (val: any) => {
    if (!val) return undefined;
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return undefined;
  };

  return {
    id: snapshot.id,
    title: data.title,
    description: data.description || "",
    priority: data.priority || 'Medium',
    status: data.status || 'To Do',
    startDate: toIsoString(data.startDate),
    dueDate: toIsoString(data.dueDate),
    channel: data.channel || undefined,
    tags: data.tags || [],
    completed: data.completed || (data.status === 'Done'),
    archived: data.archived || false,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    userId: data.userId,
    workspaceId: data.workspaceId || undefined,
    assignedTo: data.assignedTo || undefined,
  };
};

/**
 * Fetches tasks for a user or a workspace.
 * If workspaceId is provided, it fetches all tasks belonging to that workspace.
 * Otherwise, it fetches personal tasks (where userId matches and workspaceId is null).
 */
export const getTasks = async (userId: string, workspaceId?: string): Promise<Task[]> => {
  if (!userId) return [];
  const tasksRef = collection(db, TASK_COLLECTION);
  try {
    let q;
    if (workspaceId) {
      // Team Context: Anyone in the workspace can see all tasks in that workspace
      q = query(
        tasksRef, 
        where('workspaceId', '==', workspaceId),
        orderBy('order', 'asc'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Personal Context: User sees tasks they created that are NOT in a workspace
      q = query(
        tasksRef, 
        where('userId', '==', userId), 
        where('workspaceId', '==', null),
        orderBy('order', 'asc'), 
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(taskFromFirestore);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'list'
      } satisfies SecurityRuleContext));
    }
    return [];
  }
};

export const addTask = async (userId: string, taskData: TaskData): Promise<Task> => {
  if (!userId) throw new Error("User ID is required");
  
  const tasksRef = collection(db, TASK_COLLECTION);
  const docData: any = {
    title: taskData.title,
    description: taskData.description || "",
    priority: taskData.priority || 'Medium',
    status: data.status || 'To Do',
    userId,
    workspaceId: taskData.workspaceId || null,
    assignedTo: taskData.assignedTo || null,
    tags: taskData.tags || [],
    completed: taskData.status === 'Done' ? true : (taskData.completed || false),
    archived: false,
    order: taskData.order ?? Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    startDate: taskData.startDate ? Timestamp.fromDate(new Date(taskData.startDate)) : null,
    dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
    channel: taskData.channel || null,
  };

  addDoc(tasksRef, docData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'create',
        requestResourceData: docData,
      } satisfies SecurityRuleContext));
    }
  });

  return { 
    id: 'optimistic-id-' + Date.now(), 
    ...taskData,
    userId,
    archived: false,
    completed: docData.completed,
    order: docData.order,
  } as Task;
};

export const updateTask = async (userId: string, taskId: string, taskUpdate: Partial<TaskData & { completed?: boolean, archived?: boolean }>): Promise<void> => {
  if (!userId || !taskId) return;
  const taskRef = doc(db, TASK_COLLECTION, taskId);
  
  const updateData: any = { ...taskUpdate, updatedAt: serverTimestamp() };
  
  if (taskUpdate.startDate) updateData.startDate = Timestamp.fromDate(new Date(taskUpdate.startDate));
  if (taskUpdate.dueDate) updateData.dueDate = Timestamp.fromDate(new Date(taskUpdate.dueDate));
  
  delete updateData.userId;
  delete updateData.createdAt;
  delete updateData.id;

  if (updateData.assignedTo === undefined && 'assignedTo' in taskUpdate) updateData.assignedTo = null;
  if (updateData.workspaceId === undefined && 'workspaceId' in taskUpdate) updateData.workspaceId = null;
  if (updateData.channel === undefined && 'channel' in taskUpdate) updateData.channel = null;

  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  updateDoc(taskRef, updateData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: taskRef.path,
        operation: 'update',
        requestResourceData: updateData,
      } satisfies SecurityRuleContext));
    }
  });
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  if (!userId || !taskId) return;
  const taskRef = doc(db, TASK_COLLECTION, taskId);
  
  deleteDoc(taskRef).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: taskRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    }
  });
};
