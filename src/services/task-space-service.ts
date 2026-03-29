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
import { FirestorePermissionError } from '@/firebase/errors';

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
      }));
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
      }));
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

/**
 * Applies a set of tasks to a user's active board by deleting current tasks and adding new ones.
 */
export const applyTasksToUser = async (userId: string, newTasksData: TaskData[]): Promise<void> => {
  if (!userId) throw new Error("User not authenticated.");

  const tasksRef = collection(db, TASK_COLLECTION);
  const q = query(tasksRef, where('userId', '==', userId));
  const currentTasksSnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  currentTasksSnapshot.forEach(doc => batch.delete(doc.ref));

  newTasksData.forEach(taskData => {
    const newTaskRef = doc(collection(db, TASK_COLLECTION));
    batch.set(newTaskRef, {
      ...taskData,
      userId,
      completed: taskData.status === 'Done' ? true : (taskData.completed || false),
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startDate: taskData.startDate ? Timestamp.fromDate(new Date(taskData.startDate)) : null,
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
    });
  });

  batch.commit().catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'batch-write',
        operation: 'write'
      }));
    }
  });
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
      }));
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
      }));
    }
  });
};
