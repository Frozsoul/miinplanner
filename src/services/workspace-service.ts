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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const WORKSPACE_COLLECTION = 'workspaces';
const USER_COLLECTION = 'users';

export const createWorkspace = async (userId: string, name: string): Promise<Workspace> => {
  const workspacesRef = collection(db, WORKSPACE_COLLECTION);
  const docData = {
    name,
    ownerId: userId,
    memberUids: [userId],
    createdAt: serverTimestamp(),
  };

  addDoc(workspacesRef, docData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: workspacesRef.path,
        operation: 'create',
        requestResourceData: docData,
      } satisfies SecurityRuleContext));
    }
  });
  
  return {
    id: 'optimistic-ws-' + Date.now(),
    name,
    ownerId: userId,
    memberUids: [userId],
    createdAt: new Date(),
  };
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const workspacesRef = collection(db, WORKSPACE_COLLECTION);
  try {
    const q = query(workspacesRef, where('memberUids', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Workspace));
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: workspacesRef.path,
        operation: 'list'
      } satisfies SecurityRuleContext));
    }
    return [];
  }
};

export const getWorkspaceMembers = async (memberUids: string[]): Promise<WorkspaceMember[]> => {
  if (memberUids.length === 0) return [];
  
  const members: WorkspaceMember[] = [];
  for (const uid of memberUids) {
    const userRef = doc(db, USER_COLLECTION, uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        members.push({
          uid: userDoc.id,
          email: userDoc.data().email,
          displayName: userDoc.data().displayName,
        });
      }
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'get'
        } satisfies SecurityRuleContext));
      }
    }
  }
  return members;
};

export const inviteMemberByEmail = async (workspaceId: string, email: string): Promise<void> => {
  const usersRef = collection(db, USER_COLLECTION);
  const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('User not found. They must have a MiinPlanner account first.');
    }
    
    const userToInvite = snapshot.docs[0];
    const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
    const updateData = {
      memberUids: arrayUnion(userToInvite.id)
    };
    
    updateDoc(workspaceRef, updateData).catch(async (err) => {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: workspaceRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      }
    });
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: usersRef.path,
        operation: 'list'
      } satisfies SecurityRuleContext));
    } else {
      throw err;
    }
  }
};

export const removeMember = async (workspaceId: string, userId: string): Promise<void> => {
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  const updateData = {
    memberUids: arrayRemove(userId)
  };
  
  updateDoc(workspaceRef, updateData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: workspaceRef.path,
        operation: 'update',
        requestResourceData: updateData
      } satisfies SecurityRuleContext));
    }
  });
};
