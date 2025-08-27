
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

const TASK_COLLECTION = 'tasks';

// Helper to convert Firestore doc to Task object
const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    description: data.description || "",
    priority: data.priority || 'Medium',
    status: data.status || 'To Do',
    startDate: data.startDate ? (data.startDate as Timestamp).toDate().toISOString() : undefined,
    dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString() : undefined,
    channel: data.channel || undefined,
    tags: data.tags || [],
    completed: data.completed || (data.status === 'Done'), // Infer completed from status if not present
    archived: data.archived || false, // Add archived field
    order: data.order, // Add order field
    createdAt: data.createdAt, // This will be a Firestore Timestamp
    updatedAt: data.updatedAt, // This will be a Firestore Timestamp
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
    // Fetch all tasks for the user, sorting by order first, then by creation date.
    const q = query(
        tasksRef, 
        where('userId', '==', userId), 
        orderBy('order', 'asc'), 
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    console.error("Full error object during getTasks:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
      completed: taskData.status === 'Done' ? true : (taskData.completed || false),
      archived: false, // New tasks are never archived
      order: taskData.order ?? Date.now(), // Use provided order or timestamp for sorting
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startDate: taskData.startDate ? Timestamp.fromDate(new Date(taskData.startDate)) : null,
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      tags: taskData.tags || [],
      status: taskData.status || 'To Do',
      channel: taskData.channel || null,
    };
    
    if (!taskData.description) {
        docData.description = ""; 
    }

    const docRef = await addDoc(tasksRef, docData);
    // For immediate use, we can return a Task-like object.
    // Actual createdAt/updatedAt will be server-generated.
    return { 
        id: docRef.id, 
        ...taskData, // original taskData
        userId,
        archived: false,
        completed: docData.completed,
        order: docData.order,
        // createdAt and updatedAt are Timestamps from server, not immediately available.
        // For optimistic UI, we can use client-side new Date() if needed, but fromFirestore handles real values.
    } as Task; // Cast as Task, acknowledging serverTimestamps aren't here yet.
  } catch (error) {
    console.error("Error adding task:", error);
    console.error("Full error object during addTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const updateTask = async (userId: string, taskId: string, taskUpdate: Partial<TaskData & { completed?: boolean, archived?: boolean }>): Promise<void> => {
  if (!userId || !taskId) {
    throw new Error("User ID and Task ID are required to update a task.");
  }
  try {
    const taskRef = doc(db, TASK_COLLECTION, taskId);
    const updateData: any = { ...taskUpdate, updatedAt: serverTimestamp() };
    
    if (taskUpdate.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(taskUpdate.startDate));
    } else if (taskUpdate.hasOwnProperty('startDate') && taskUpdate.startDate === undefined) {
      updateData.startDate = null; 
    }

    if (taskUpdate.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(taskUpdate.dueDate));
    } else if (taskUpdate.hasOwnProperty('dueDate') && taskUpdate.dueDate === undefined) {
      updateData.dueDate = null; 
    }
    
    if (taskUpdate.hasOwnProperty('status')) {
      updateData.status = taskUpdate.status;
      if (taskUpdate.status === 'Done') {
        updateData.completed = true;
      } else if (taskUpdate.completed === undefined && updateData.status !== 'Done') { 
        updateData.completed = false;
      }
    } else if (taskUpdate.hasOwnProperty('completed')) {
       // Handled by completed field in TaskData
    }
    
    if (taskUpdate.hasOwnProperty('tags')) {
      updateData.tags = taskUpdate.tags || [];
    }
    if (taskUpdate.hasOwnProperty('channel')) {
      updateData.channel = taskUpdate.channel || null;
    }

    if (taskUpdate.hasOwnProperty('archived')) {
        updateData.archived = taskUpdate.archived;
    }
    
    if (taskUpdate.hasOwnProperty('order')) {
        updateData.order = taskUpdate.order;
    }


    // Ensure we don't try to update userId or createdAt directly
    delete updateData.userId;
    delete updateData.createdAt;
    
    await updateDoc(taskRef, updateData);
  } catch (error) {
    console.error("Error updating task:", error);
    console.error("Full error object during updateTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
   if (!userId || !taskId) {
    throw new Error("User ID and Task ID are required to delete a task.");
  }
  try {
    const taskRef = doc(db, TASK_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    console.error("Full error object during deleteTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};
