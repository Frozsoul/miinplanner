import { db } from '@/lib/firebase';
import type { TaskSpace, TaskData, TaskStatus } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const USER_COLLECTION = 'users';
const TASK_SPACE_COLLECTION = 'taskSpaces';
const TASK_COLLECTION = 'tasks';

export const getTaskSpaces = async (userId: string): Promise<TaskSpace[]> => {
  if (!userId) return [];
  const spacesRef = collection(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION);
  try {
    const q = query(spacesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      tasks: doc.data().tasks || [],
      taskStatuses: doc.data().taskStatuses,
    }));
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: spacesRef.path,
        operation: 'list'
      } satisfies SecurityRuleContext));
    }
    return [];
  }
};

export const saveTaskSpace = async (userId: string, name: string, tasks: TaskData[], taskStatuses: TaskStatus[]): Promise<TaskSpace> => {
  if (!userId) throw new Error("User not authenticated.");
  const spacesRef = collection(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION);
  const docData = {
    name,
    tasks,
    taskStatuses,
    createdAt: serverTimestamp(),
  };

  addDoc(spacesRef, docData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: spacesRef.path,
        operation: 'create',
        requestResourceData: docData,
      } satisfies SecurityRuleContext));
    }
  });

  return {
    id: 'optimistic-space-' + Date.now(),
    name,
    tasks,
    taskStatuses,
    createdAt: new Date(),
  };
};

const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch; keep headroom.

const toIso = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return undefined;
};

const toTimestamp = (val?: string): Timestamp | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
};

const commitInChunks = async (ops: ((batch: ReturnType<typeof writeBatch>) => void)[]) => {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_LIMIT).forEach(op => op(batch));
    await batch.commit();
  }
};

/**
 * Snapshots the user's personal board (tasks not in any workspace) into a new
 * saved space, so a replace can always be undone from Saved Spaces.
 * Returns the number of tasks backed up. Throws if the backup could not be written.
 */
export const backupPersonalBoard = async (
  userId: string,
  label: string,
  taskStatuses: TaskStatus[],
): Promise<number> => {
  if (!userId) throw new Error("User not authenticated.");
  const q = query(collection(db, TASK_COLLECTION), where('userId', '==', userId), where('workspaceId', '==', null));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  const tasks: TaskData[] = snapshot.docs.map(d => {
    const data = d.data();
    const task: any = {
      title: data.title,
      description: data.description || "",
      priority: data.priority || 'Medium',
      status: data.status || 'To Do',
      tags: data.tags || [],
      archived: data.archived || false,
      completed: data.completed || false,
      order: data.order ?? 0,
    };
    const startDate = toIso(data.startDate);
    const dueDate = toIso(data.dueDate);
    if (startDate) task.startDate = startDate;
    if (dueDate) task.dueDate = dueDate;
    if (data.channel) task.channel = data.channel;
    return task as TaskData;
  });

  await addDoc(collection(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION), {
    name: label,
    tasks,
    taskStatuses,
    createdAt: serverTimestamp(),
  });
  return tasks.length;
};

/**
 * Replaces the user's PERSONAL board with the given tasks.
 * Tasks inside workspaces (shared with teammates) are never touched.
 * Callers should run backupPersonalBoard first.
 */
export const applyTasksToUser = async (userId: string, newTasksData: TaskData[]): Promise<void> => {
  if (!userId) throw new Error("User not authenticated.");

  const tasksRef = collection(db, TASK_COLLECTION);
  try {
    const q = query(tasksRef, where('userId', '==', userId), where('workspaceId', '==', null));
    const currentTasksSnapshot = await getDocs(q);

    const ops: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
    currentTasksSnapshot.forEach(d => ops.push(batch => batch.delete(d.ref)));

    const baseOrder = Date.now();
    newTasksData.forEach((taskData, i) => {
      const docToSet: any = {
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority || 'Medium',
        status: taskData.status || 'To Do',
        userId,
        workspaceId: null,
        assignedTo: null,
        tags: taskData.tags || [],
        completed: taskData.status === 'Done' ? true : (taskData.completed || false),
        archived: taskData.archived || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: toTimestamp(taskData.startDate),
        dueDate: toTimestamp(taskData.dueDate),
        channel: taskData.channel || null,
        order: taskData.order ?? baseOrder + i,
      };
      ops.push(batch => batch.set(doc(tasksRef), docToSet));
    });

    await commitInChunks(ops);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'write'
      } satisfies SecurityRuleContext));
    }
    throw err;
  }
};

export const loadTasksFromSpace = async (userId: string, spaceId: string): Promise<{tasks: TaskData[], taskStatuses?: TaskStatus[]}> => {
  if (!userId) throw new Error("User not authenticated.");
  const spaceRef = doc(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION, spaceId);
  
  try {
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Task space not found.");
    
    const newTasksData: TaskData[] = spaceSnap.data().tasks || [];
    const newStatuses: TaskStatus[] | undefined = spaceSnap.data().taskStatuses;

    await applyTasksToUser(userId, newTasksData);

    return { tasks: newTasksData, taskStatuses: newStatuses };
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: spaceRef.path,
        operation: 'get'
      } satisfies SecurityRuleContext));
    }
    throw err;
  }
};

export const deleteTaskSpace = async (userId: string, spaceId: string): Promise<void> => {
  if (!userId) return;
  const spaceRef = doc(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION, spaceId);
  
  deleteDoc(spaceRef).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: spaceRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    }
  });
};
