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
import { FirestorePermissionError } from '@/firebase/errors';

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

export const getTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) return [];
  const tasksRef = collection(db, TASK_COLLECTION);
  try {
    const q = query(
        tasksRef, 
        where('userId', '==', userId), 
        orderBy('order', 'asc'), 
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(taskFromFirestore);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'list'
      }));
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
    status: taskData.status || 'To Do',
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

  // Avoid block, optimistic UI handling
  addDoc(tasksRef, docData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'create',
        requestResourceData: docData,
      }));
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
  
  // Clean up read-only fields
  delete updateData.userId;
  delete updateData.createdAt;
  delete updateData.id;

  // Convert optional fields to null if they are undefined to avoid Firestore errors
  if (updateData.assignedTo === undefined && 'assignedTo' in taskUpdate) updateData.assignedTo = null;
  if (updateData.workspaceId === undefined && 'workspaceId' in taskUpdate) updateData.workspaceId = null;
  if (updateData.channel === undefined && 'channel' in taskUpdate) updateData.channel = null;

  // Final sweep: remove any remaining undefined values
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
      }));
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
      }));
    }
  });
};