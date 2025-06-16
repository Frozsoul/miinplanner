
import { db } from '@/lib/firebase';
import type { Task, TaskData, TaskStage } from '@/types';
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
    dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString() : undefined,
    completed: data.completed || false,
    stage: data.stage || 'To Do', // Default to "To Do" if not set
    tags: data.tags || [],
    createdAt: data.createdAt, // This will be a Firestore Timestamp
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
    // Consider ordering by stage or a custom order field in the future
    const q = query(tasksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
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
      completed: taskData.stage === 'Done' ? true : (taskData.completed || false),
      createdAt: serverTimestamp(),
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      tags: taskData.tags || [],
      stage: taskData.stage || 'To Do',
    };
    
    if (!taskData.description) {
        docData.description = ""; // Ensure empty string if undefined
    }


    const docRef = await addDoc(tasksRef, docData);
    // Constructing the task object for return
    // Note: createdAt will be a server timestamp, not immediately available client-side without a re-fetch
    return { 
        id: docRef.id, 
        ...taskData,
        userId,
        completed: docData.completed,
        stage: docData.stage,
        tags: docData.tags,
        // createdAt will be a server timestamp
    } as Task;
  } catch (error) {
    console.error("Error adding task:", error);
    console.error("Full error object during addTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const updateTask = async (userId: string, taskId: string, taskUpdate: Partial<TaskData & { completed?: boolean; stage?: TaskStage }>): Promise<void> => {
  if (!userId || !taskId) {
    throw new Error("User ID and Task ID are required to update a task.");
  }
  try {
    const taskRef = doc(db, TASK_COLLECTION, taskId);
    const updateData: any = { ...taskUpdate };

    if (taskUpdate.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(taskUpdate.dueDate));
    } else if (taskUpdate.hasOwnProperty('dueDate') && taskUpdate.dueDate === undefined) {
      updateData.dueDate = null; 
    }
    
    if (taskUpdate.hasOwnProperty('stage')) {
      updateData.stage = taskUpdate.stage;
      if (taskUpdate.stage === 'Done') {
        updateData.completed = true;
      } else if (taskUpdate.completed === undefined && updateData.stage !== 'Done') { 
        // If completed is not explicitly set and stage is not Done, ensure completed is false
        updateData.completed = false;
      }
    } else if (taskUpdate.hasOwnProperty('completed')) {
      // If only completed is changing, update stage accordingly if it makes sense
      if (taskUpdate.completed === true) {
        // Optionally move to 'Done' stage if marked complete, unless stage is also being set
        // For now, let stage be managed separately or by the AI/user directly
      }
    }
    
    if (taskUpdate.tags) {
      updateData.tags = taskUpdate.tags;
    }


    // Ensure we don't try to update userId or createdAt directly if they are part of TaskData
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

