
'use client';

import { db } from '@/lib/firebase';
import type { Workspace, WorkspaceMember } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';

const WORKSPACE_COLLECTION = 'workspaces';
const USER_COLLECTION = 'users';

export const createWorkspace = async (userId: string, name: string): Promise<Workspace> => {
  const workspacesRef = collection(db, WORKSPACE_COLLECTION);
  const docRef = await addDoc(workspacesRef, {
    name,
    ownerId: userId,
    memberUids: [userId],
    createdAt: serverTimestamp(),
  });
  
  return {
    id: docRef.id,
    name,
    ownerId: userId,
    memberUids: [userId],
    createdAt: new Date(),
  };
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const workspacesRef = collection(db, WORKSPACE_COLLECTION);
  const q = query(workspacesRef, where('memberUids', 'array-contains', userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Workspace));
};

export const getWorkspaceMembers = async (memberUids: string[]): Promise<WorkspaceMember[]> => {
  if (memberUids.length === 0) return [];
  
  const members: WorkspaceMember[] = [];
  // Firestore limit for 'in' queries is 10, but for now we assume small teams
  for (const uid of memberUids) {
    const userDoc = await getDoc(doc(db, USER_COLLECTION, uid));
    if (userDoc.exists()) {
      members.push({
        uid: userDoc.id,
        email: userDoc.data().email,
        displayName: userDoc.data().displayName,
      });
    }
  }
  return members;
};

export const inviteMemberByEmail = async (workspaceId: string, email: string): Promise<void> => {
  const usersRef = collection(db, USER_COLLECTION);
  const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('User not found. They must have a MiinPlanner account first.');
  }
  
  const userToInvite = snapshot.docs[0];
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  
  await updateDoc(workspaceRef, {
    memberUids: arrayUnion(userToInvite.id)
  });
};

export const removeMember = async (workspaceId: string, userId: string): Promise<void> => {
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  await updateDoc(workspaceRef, {
    memberUids: arrayRemove(userId)
  });
};
