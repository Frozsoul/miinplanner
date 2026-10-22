'use client';

/**
 * Team hub: pinned links and one shared team note per workspace.
 *
 * - `workspaces/{id}/links/{linkId}`: { title, url, addedBy, createdAt }
 * - `workspaces/{id}/hub/notes`: { text, updatedBy, updatedByName, updatedAt, version }
 *
 * Any member can read and edit (rules in firebase.rules). Both are live (onSnapshot), so
 * teammates see changes without reloading. Permission errors are passed to the caller instead
 * of the global error listener, so the board still works if the rules aren't deployed yet.
 */

import { db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';

export interface TeamLink {
  id: string;
  title: string;
  url: string;
  addedBy: string;
  createdAt?: Date;
}

export interface TeamNote {
  text: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: Date;
  version: number;
}

export const MAX_LINKS = 20;
export const MAX_NOTE_LENGTH = 10000;

type Unsubscribe = () => void;
type OnError = (code: string) => void;

function toDate(v: unknown): Date | undefined {
  return v && typeof (v as Timestamp).toDate === 'function' ? (v as Timestamp).toDate() : undefined;
}

export function subscribeTeamLinks(workspaceId: string, onData: (links: TeamLink[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(db, 'workspaces', workspaceId, 'links'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({
      id: d.id,
      title: d.get('title') || '',
      url: d.get('url') || '',
      addedBy: d.get('addedBy') || '',
      createdAt: toDate(d.get('createdAt')),
    }))),
    err => onError(err.code || 'unknown'),
  );
}

export function subscribeTeamNote(workspaceId: string, onData: (note: TeamNote) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    doc(db, 'workspaces', workspaceId, 'hub', 'notes'),
    snap => onData(snap.exists()
      ? {
          text: snap.get('text') || '',
          updatedBy: snap.get('updatedBy'),
          updatedByName: snap.get('updatedByName'),
          updatedAt: toDate(snap.get('updatedAt')),
          version: snap.get('version') || 0,
        }
      : { text: '', version: 0 }),
    err => onError(err.code || 'unknown'),
  );
}

/** Adds "https://" when missing and checks it's a web link. Returns null when it isn't. */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.')) return null;
    return u.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export async function addTeamLink(workspaceId: string, uid: string, title: string, url: string): Promise<void> {
  await addDoc(collection(db, 'workspaces', workspaceId, 'links'), {
    title: title.trim().slice(0, 100),
    url,
    addedBy: uid,
    createdAt: serverTimestamp(),
  });
}

/** Removes the pinned link only. The file it points to is never touched. */
export async function removeTeamLink(workspaceId: string, linkId: string): Promise<void> {
  await deleteDoc(doc(db, 'workspaces', workspaceId, 'links', linkId));
}

export class NoteConflictError extends Error {
  constructor(public latest: TeamNote) {
    super('The note changed while you were editing.');
  }
}

/**
 * Saves the team note only if nobody else saved since `baseVersion` (the version the editor
 * started from). Otherwise throws NoteConflictError with the latest note, so no one's
 * words are silently overwritten.
 */
export async function saveTeamNote(
  workspaceId: string,
  user: { uid: string; name: string },
  text: string,
  baseVersion: number,
): Promise<void> {
  const ref = doc(db, 'workspaces', workspaceId, 'hub', 'notes');
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? (snap.get('version') as number) || 0 : 0;
    if (current !== baseVersion) {
      throw new NoteConflictError({
        text: snap.get('text') || '',
        updatedBy: snap.get('updatedBy'),
        updatedByName: snap.get('updatedByName'),
        updatedAt: toDate(snap.get('updatedAt')),
        version: current,
      });
    }
    tx.set(ref, {
      text: text.slice(0, MAX_NOTE_LENGTH),
      updatedBy: user.uid,
      updatedByName: user.name.slice(0, 100),
      updatedAt: serverTimestamp(),
      version: current + 1,
    });
  });
}
