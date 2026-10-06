'use server';

/**
 * @fileOverview Server actions for workspace members.
 *
 * Firestore rules only let a user read their own `users/{uid}` doc, so the
 * client can no longer list users or read teammates' emails directly.
 * These actions do the two lookups the app needs, with firebase-admin,
 * after checking the caller's ID token and workspace membership.
 *
 * Like the AI actions, they return `{ ok, data }` or `{ ok: false, message }`
 * because Next.js hides thrown messages in production.
 */

import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb, uidFromIdToken } from '@/lib/firebase-admin';
import type { WorkspaceMember } from '@/types';

export type MemberActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const SESSION_EXPIRED = 'Your session expired. Please sign in again.';
const SERVER_ERROR = "Something went wrong on our side. Please try again in a moment.";
const MAX_MEMBERS = 50;

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && !id.includes('/');
}

/** Returns uid, email and display name for each member of a workspace the caller belongs to. */
export async function getWorkspaceMembersAction(
  idToken: string,
  workspaceId: string,
): Promise<MemberActionResult<WorkspaceMember[]>> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  if (!isValidId(workspaceId)) return { ok: false, message: 'Workspace not found.' };

  try {
    const db = adminDb();
    const wsSnap = await db.collection('workspaces').doc(workspaceId).get();
    const memberUids: unknown = wsSnap.data()?.memberUids;
    if (!wsSnap.exists || !Array.isArray(memberUids) || !memberUids.includes(uid)) {
      return { ok: false, message: 'Workspace not found.' };
    }

    const ids = memberUids.filter(isValidId).slice(0, MAX_MEMBERS);
    if (ids.length === 0) return { ok: true, data: [] };
    const snaps = await db.getAll(...ids.map(id => db.collection('users').doc(id)));
    const members: WorkspaceMember[] = snaps
      .filter(s => s.exists)
      .map(s => ({
        uid: s.id,
        email: String(s.data()?.email ?? ''),
        displayName: s.data()?.displayName || undefined,
      }));
    return { ok: true, data: members };
  } catch (error: any) {
    console.error('[MiinPlanner members] Failed to load members:', error?.message || error);
    return { ok: false, message: SERVER_ERROR };
  }
}

/** Adds an existing MiinPlanner user to a workspace by exact email. Owner only. */
export async function inviteWorkspaceMemberAction(
  idToken: string,
  workspaceId: string,
  email: string,
): Promise<MemberActionResult<WorkspaceMember>> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  if (!isValidId(workspaceId)) return { ok: false, message: 'Workspace not found.' };

  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (!trimmed || trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  try {
    const db = adminDb();
    const wsRef = db.collection('workspaces').doc(workspaceId);
    const wsSnap = await wsRef.get();
    if (!wsSnap.exists || wsSnap.data()?.ownerId !== uid) {
      return { ok: false, message: 'Only the workspace owner can invite people.' };
    }

    // Emails are saved as Firebase Auth returns them, so try the lowercase form
    // first and then the exact text that was typed. Exact matches only.
    const candidates = Array.from(new Set([trimmed.toLowerCase(), trimmed]));
    let found: QueryDocumentSnapshot | undefined;
    for (const candidate of candidates) {
      const snap = await db.collection('users').where('email', '==', candidate).limit(1).get();
      if (!snap.empty) {
        found = snap.docs[0];
        break;
      }
    }
    if (!found) {
      return { ok: false, message: 'User not found. They must have a MiinPlanner account first.' };
    }

    await wsRef.update({ memberUids: FieldValue.arrayUnion(found.id) });
    return {
      ok: true,
      data: {
        uid: found.id,
        email: String(found.data().email ?? trimmed),
        displayName: found.data().displayName || undefined,
      },
    };
  } catch (error: any) {
    console.error('[MiinPlanner members] Invite failed:', error?.message || error);
    return { ok: false, message: SERVER_ERROR };
  }
}
