
import { db } from '@/lib/firebase';
import type { Task, TaskData } from '@/types';
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

const TASK_COLLECTION = 'tasks';

// Helper to convert Firestore doc to Task object
const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString() : undefined,
    completed: data.completed,
    createdAt: data.createdAt,
    userId: data.userId,
  };
};


export const getTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) {
    console.error("User ID is required to fetch tasks.");
    return [];
  }
  try {
    const tasksRef = collection(db, TASK_COLLECTION);
    const q = query(tasksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const addTask = async (userId: string, taskData: TaskData): Promise<Task> => {
  if (!userId) {
    throw new Error("User ID is required to add a task.");
  }
  try {
    const tasksRef = collection(db, TASK_COLLECTION);
    const docData: any = {
      ...taskData,
      userId,
      completed: false, // Ensure completed is false for new tasks
      createdAt: serverTimestamp(),
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
    };
    if (!taskData.description) {
        delete docData.description;
    }


    const docRef = await addDoc(tasksRef, docData);
    // For consistency, we can re-fetch or construct the task object.
    // Here, constructing it is simpler if serverTimestamp isn't immediately critical for display.
    return { 
        id: docRef.id, 
        ...taskData, 
        userId, 
        completed: false,
        // createdAt will be a server timestamp, not available immediately without another read
    } as Task;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

export const updateTask = async (userId: string, taskId: string, taskUpdate: Partial<TaskData>): Promise<void> => {
  if (!userId || !taskId) {
    throw new Error("User ID and Task ID are required to update a task.");
  }
  try {
    const taskRef = doc(db, TASK_COLLECTION, taskId);
    const updateData: any = { ...taskUpdate };
    if (taskUpdate.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(taskUpdate.dueDate));
    } else if (taskUpdate.hasOwnProperty('dueDate') && taskUpdate.dueDate === undefined) {
      updateData.dueDate = null; // Handle explicit clearing of due date
    }

    // Ensure we don't try to update userId or createdAt directly if they are part of TaskData
    delete updateData.userId;
    delete updateData.createdAt;
    
    await updateDoc(taskRef, updateData);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
   if (!userId || !taskId) {
    throw new Error("User ID and Task ID are required to delete a task.");
  }
  try {
    const taskRef = doc(db, TASK_COLLECTION, taskId);
    // Optionally, verify task belongs to user before deleting if rules aren't enough
    await deleteDoc(taskRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
