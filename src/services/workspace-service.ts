
'use client';

import { db } from '@/lib/firebase';
import type { Workspace, WorkspaceMember, TaskStatus } from '@/types';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getWorkspaceMembersAction, inviteWorkspaceMemberAction } from '@/services/workspace-members-actions';

const WORKSPACE_COLLECTION = 'workspaces';

/**
 * Creates a new workspace.
 * Generates a real Firestore ID immediately to prevent race conditions with task creation.
 */
export const createWorkspace = async (userId: string, name: string, taskStatuses: TaskStatus[]): Promise<Workspace> => {
  const workspacesRef = collection(db, WORKSPACE_COLLECTION);
  const newWorkspaceRef = doc(workspacesRef); // Generate valid ID on the client
  
  const docData = {
    name,
    ownerId: userId,
    memberUids: [userId],
    taskStatuses, // Seed with initial statuses
    createdAt: serverTimestamp(),
  };

  // Initiate creation without blocking
  setDoc(newWorkspaceRef, docData).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: newWorkspaceRef.path,
        operation: 'create',
        requestResourceData: docData,
      } satisfies SecurityRuleContext));
    }
  });
  
  return {
    id: newWorkspaceRef.id, // Use the real ID immediately
    name,
    ownerId: userId,
    memberUids: [userId],
    taskStatuses,
    createdAt: new Date(),
  };
};

export const updateWorkspaceStatuses = async (workspaceId: string, taskStatuses: TaskStatus[]): Promise<void> => {
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  const updateData = { taskStatuses };
  
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

/**
 * Loads member profiles through a server action. Firestore rules don't let
 * users read each other's profile docs, so this can't be done client-side.
 */
export const getWorkspaceMembers = async (idToken: string, workspaceId: string): Promise<WorkspaceMember[]> => {
  let result;
  try {
    result = await getWorkspaceMembersAction(idToken, workspaceId);
  } catch (err) {
    console.warn('[MiinPlanner] Could not reach the members action:', err);
    return [];
  }
  if (!result.ok) {
    console.warn('[MiinPlanner] Could not load workspace members:', result.message);
    return [];
  }
  return result.data;
};

/**
 * Adds an existing user to the workspace by exact email, via a server action.
 * Throws with a readable message if the invite fails.
 */
export const inviteMemberByEmail = async (idToken: string, workspaceId: string, email: string): Promise<WorkspaceMember> => {
  const result = await inviteWorkspaceMemberAction(idToken, workspaceId, email);
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
};

export const removeMember = async (workspaceId: string, userId: string): Promise<void> => {
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  const updateData = {
    memberUids: arrayRemove(userId)
  };
  
  setDoc(workspaceRef, updateData, { merge: true }).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: workspaceRef.path,
        operation: 'update',
        requestResourceData: updateData
      } satisfies SecurityRuleContext));
    }
  });
};

export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  const workspaceRef = doc(db, WORKSPACE_COLLECTION, workspaceId);
  
  deleteDoc(workspaceRef).catch(async (err) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: workspaceRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    }
  });
};
