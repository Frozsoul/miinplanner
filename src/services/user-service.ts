
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const USER_COLLECTION = 'users';

const fromFirestore = (snapshot: any): UserProfile | null => {
    if (!snapshot.exists()) {
        return null;
    }
    const data = snapshot.data();
    return {
        id: snapshot.id,
        email: data.email,
        displayName: data.displayName || '',
        plan: data.plan || 'free',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    try {
        const userRef = doc(db, USER_COLLECTION, userId);
        const userSnap = await getDoc(userRef);
        return fromFirestore(userSnap);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const createUserProfile = async (userData: UserProfile): Promise<void> => {
    try {
        const userRef = doc(db, USER_COLLECTION, userData.id);
        const dataToSet = {
            ...userData,
            createdAt: serverTimestamp(),
        };
        // Use setDoc with merge: true to avoid overwriting if it somehow already exists
        await setDoc(userRef, dataToSet, { merge: true }); 
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!userId) throw new Error("User ID is required to update profile.");
    try {
        const userRef = doc(db, USER_COLLECTION, userId);
        await updateDoc(userRef, updates);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};
