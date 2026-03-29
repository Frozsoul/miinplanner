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
import { DEFAULT_TASK_STATUSES } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const USER_COLLECTION = 'users';

const fromFirestore = (snapshot: any): UserProfile | null => {
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
        id: snapshot.id,
        email: data.email,
        displayName: data.displayName || '',
        plan: data.plan || 'free',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        taskStatuses: data.taskStatuses || DEFAULT_TASK_STATUSES,
        insightGenerationCount: data.insightGenerationCount || 0,
        lastInsightGenerationDate: data.lastInsightGenerationDate || '',
        chatbotMessageCount: data.chatbotMessageCount || 0,
        lastChatbotMessageDate: data.lastChatbotMessageDate || '',
    };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const userRef = doc(db, USER_COLLECTION, userId);
    try {
        const userSnap = await getDoc(userRef);
        return fromFirestore(userSnap);
    } catch (err: any) {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'get'
          } satisfies SecurityRuleContext));
        }
        return null;
    }
};

export const createUserProfile = async (userData: UserProfile): Promise<void> => {
    const userRef = doc(db, USER_COLLECTION, userData.id);
    const dataToSet = {
        ...userData,
        createdAt: serverTimestamp(),
        taskStatuses: DEFAULT_TASK_STATUSES,
        plan: 'free',
        insightGenerationCount: 0,
        lastInsightGenerationDate: '',
        chatbotMessageCount: 0,
        lastChatbotMessageDate: '',
    };
    
    setDoc(userRef, dataToSet, { merge: true }).catch(async (err) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: dataToSet,
          } satisfies SecurityRuleContext));
        }
    });
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!userId) return;
    const userRef = doc(db, USER_COLLECTION, userId);
    
    updateDoc(userRef, updates).catch(async (err) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updates,
          } satisfies SecurityRuleContext));
        }
    });
};
