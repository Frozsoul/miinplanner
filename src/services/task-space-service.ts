
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

const USER_COLLECTION = 'users';
const TASK_SPACE_COLLECTION = 'taskSpaces';
const TASK_COLLECTION = 'tasks';


export const getTaskSpaces = async (userId: string): Promise<TaskSpace[]> => {
  if (!userId) return [];
  try {
    const spacesRef = collection(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION);
    const q = query(spacesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      tasks: doc.data().tasks || [],
      taskStatuses: doc.data().taskStatuses, // Load statuses
    }));
  } catch (error) {
    console.error("Error fetching task spaces:", error);
    throw error;
  }
};

export const saveTaskSpace = async (userId: string, name: string, tasks: TaskData[], taskStatuses: TaskStatus[]): Promise<TaskSpace> => {
  if (!userId) throw new Error("User not authenticated.");
  try {
    const spacesRef = collection(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION);
    const docData = {
      name,
      tasks,
      taskStatuses, // Save statuses
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(spacesRef, docData);
    return {
      id: docRef.id,
      name,
      tasks,
      taskStatuses,
      createdAt: new Date(), // Client-side timestamp for immediate UI update
    };
  } catch (error) {
    console.error("Error saving task space:", error);
    throw error;
  }
};

export const loadTasksFromSpace = async (userId: string, spaceId: string): Promise<{tasks: TaskData[], taskStatuses?: TaskStatus[]}> => {
  if (!userId) throw new Error("User not authenticated.");
  try {
    // 1. Get the tasks from the saved space
    const spaceRef = doc(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION, spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Task space not found.");
    const newTasksData: TaskData[] = spaceSnap.data().tasks || [];
    const newStatuses: TaskStatus[] | undefined = spaceSnap.data().taskStatuses;

    // 2. Get all current tasks for the user to delete them
    const tasksRef = collection(db, TASK_COLLECTION);
    const q = query(tasksRef, where('userId', '==', userId));
    const currentTasksSnapshot = await getDocs(q);
    
    // 3. Use a batch write to perform all operations atomically
    const batch = writeBatch(db);

    // Delete all current tasks
    currentTasksSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add all new tasks from the space
    newTasksData.forEach(taskData => {
      const newTaskRef = doc(collection(db, TASK_COLLECTION));
      const docData = {
        ...taskData,
        userId,
        completed: taskData.status === 'Done' ? true : (taskData.completed || false),
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: taskData.startDate ? Timestamp.fromDate(new Date(taskData.startDate)) : null,
        dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      };
      batch.set(newTaskRef, docData);
    });

    // 4. Commit the batch
    await batch.commit();

    return { tasks: newTasksData, taskStatuses: newStatuses };

  } catch (error) {
    console.error("Error loading task space:", error);
    throw error;
  }
};


export const deleteTaskSpace = async (userId: string, spaceId: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated.");
  try {
    const spaceRef = doc(db, USER_COLLECTION, userId, TASK_SPACE_COLLECTION, spaceId);
    await deleteDoc(spaceRef);
  } catch (error) {
    console.error("Error deleting task space:", error);
    throw error;
  }
};
