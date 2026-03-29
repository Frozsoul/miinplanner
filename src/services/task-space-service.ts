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

export const applyTasksToUser = async (userId: string, newTasksData: TaskData[]): Promise<void> => {
  if (!userId) throw new Error("User not authenticated.");

  const tasksRef = collection(db, TASK_COLLECTION);
  try {
    const q = query(tasksRef, where('userId', '==', userId));
    const currentTasksSnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    currentTasksSnapshot.forEach(doc => batch.delete(doc.ref));

    newTasksData.forEach(taskData => {
      const newTaskRef = doc(collection(db, TASK_COLLECTION));
      const docToSet: any = {
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: taskData.startDate ? Timestamp.fromDate(new Date(taskData.startDate)) : null,
        dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
        channel: taskData.channel || null,
        order: taskData.order || Date.now(),
      };

      batch.set(newTaskRef, docToSet);
    });

    batch.commit().catch(async (err) => {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch-write',
          operation: 'write'
        } satisfies SecurityRuleContext));
      }
    });
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'list'
      } satisfies SecurityRuleContext));
    }
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
