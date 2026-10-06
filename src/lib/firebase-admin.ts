/**
 * @fileOverview Shared firebase-admin setup for server-only code.
 *
 * Used by the AI guard (`src/ai/guard.ts`) and the workspace member actions
 * (`src/services/workspace-members-actions.ts`). Not a 'use server' module:
 * nothing here should be callable from the browser on its own.
 */

import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const FIRESTORE_DATABASE_ID = 'miinplanner';

export function adminApp(): App {
  const existing = getApps().find(a => a.name === 'miinplanner-admin');
  if (existing) return existing;
  // On Firebase App Hosting, credentials come from the backend's service account
  // (Application Default Credentials). Token verification only needs the project ID.
  return initializeApp(
    { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    'miinplanner-admin',
  );
}

export function adminDb(): Firestore {
  return getFirestore(adminApp(), FIRESTORE_DATABASE_ID);
}

/** Returns the uid for a valid Firebase ID token, or null. */
export async function uidFromIdToken(idToken: unknown): Promise<string | null> {
  if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4096) {
    return null;
  }
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}
