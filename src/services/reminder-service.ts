
import { db } from '@/lib/firebase';
import type { Reminder, ReminderData } from '@/types';
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
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

const REMINDER_COLLECTION = 'reminders';

// Helper to convert Firestore doc to Reminder object
const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Reminder => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    remindAt: (data.remindAt as Timestamp).toDate().toISOString(),
    triggered: data.triggered || false,
    createdAt: data.createdAt,
    userId: data.userId,
  };
};

export const getReminders = async (userId: string): Promise<Reminder[]> => {
  if (!userId) {
    console.error("User ID is required to fetch reminders.");
    return [];
  }
  try {
    const remindersRef = collection(db, REMINDER_COLLECTION);
    const q = query(remindersRef, where('userId', '==', userId), orderBy('remindAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    throw error;
  }
};

export const addReminder = async (userId: string, reminderData: ReminderData): Promise<Reminder> => {
  if (!userId) {
    throw new Error("User ID is required to add a reminder.");
  }
  try {
    const remindersRef = collection(db, REMINDER_COLLECTION);
    const docRef = await addDoc(remindersRef, {
      ...reminderData,
      userId,
      triggered: false,
      createdAt: serverTimestamp(),
      remindAt: Timestamp.fromDate(new Date(reminderData.remindAt)),
    });
    // Constructing the reminder object for return
    return { 
        id: docRef.id, 
        ...reminderData,
        userId, 
        triggered: false,
        remindAt: new Date(reminderData.remindAt).toISOString(), // Ensure ISO string format
        // createdAt will be a server timestamp
    } as Reminder;
  } catch (error) {
    console.error("Error adding reminder:", error);
    throw error;
  }
};

export const deleteReminder = async (userId: string, reminderId: string): Promise<void> => {
  if (!userId || !reminderId) {
    throw new Error("User ID and Reminder ID are required to delete a reminder.");
  }
  try {
    const reminderRef = doc(db, REMINDER_COLLECTION, reminderId);
    await deleteDoc(reminderRef);
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw error;
  }
};
