/**
 * @fileOverview Server-side guard for the Gemini-backed server actions.
 *
 * Every AI server action must call `guardAiCall` before it calls the model:
 * 1. The caller must send a valid Firebase ID token (verified with firebase-admin).
 * 2. Each user gets a daily quota per feature, counted in Firestore at
 *    `aiUsage/{uid}`. Clients have no access to that collection (no rule matches it),
 *    so the count can't be reset from the browser.
 *
 * This file is deliberately NOT a 'use server' module: nothing here should be
 * callable from the browser on its own.
 */

import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export type AiFeature = 'plan' | 'chat' | 'insights';

/** Daily limits per user, reset at 00:00 UTC. Keep in sync with the UI copy. */
export const AI_DAILY_LIMITS: Record<AiFeature, number> = {
  plan: 3,
  chat: 10,
  insights: 10,
};

export type AiErrorCode = 'unauthenticated' | 'limit_reached' | 'failed';

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AiErrorCode; message: string };

/**
 * Next.js hides thrown error messages from the client in production, so server
 * actions return this result instead of throwing.
 */
export class AiGuardError extends Error {
  constructor(public code: AiErrorCode, message: string) {
    super(message);
    this.name = 'AiGuardError';
  }
}

const FIRESTORE_DATABASE_ID = 'miinplanner';

function adminApp(): App {
  const existing = getApps().find(a => a.name === 'miinplanner-admin');
  if (existing) return existing;
  // On Firebase App Hosting, credentials come from the backend's service account
  // (Application Default Credentials). Token verification only needs the project ID.
  return initializeApp(
    { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    'miinplanner-admin',
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function verifyUser(idToken: unknown): Promise<string> {
  if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4096) {
    throw new AiGuardError('unauthenticated', 'Please sign in again to use AI features.');
  }
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    throw new AiGuardError('unauthenticated', 'Your session expired. Please sign in again.');
  }
}

/**
 * Atomically checks and increments today's usage for this feature.
 * If Firestore itself is unreachable (for example missing IAM on the service
 * account), we log loudly and allow the call: auth is still enforced, and a
 * broken quota store should not take the planner down.
 */
async function consumeQuota(uid: string, feature: AiFeature): Promise<void> {
  const limit = AI_DAILY_LIMITS[feature];
  const date = todayUtc();
  let allowed = true;
  try {
    const db = getFirestore(adminApp(), FIRESTORE_DATABASE_ID);
    const ref = db.collection('aiUsage').doc(uid);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() ?? {} : {};
      const used = data.date === date ? Number(data[feature] || 0) : 0;
      if (used >= limit) {
        allowed = false;
        return;
      }
      if (data.date === date) {
        tx.update(ref, { [feature]: used + 1, updatedAt: FieldValue.serverTimestamp() });
      } else {
        tx.set(ref, { date, [feature]: 1, updatedAt: FieldValue.serverTimestamp() });
      }
    });
  } catch (error: any) {
    console.error(
      `[MiinPlanner aiGuard] Quota store unavailable, allowing ${feature} call for ${uid}:`,
      error?.message || error,
    );
    return;
  }
  if (!allowed) {
    throw new AiGuardError(
      'limit_reached',
      `You've reached today's limit of ${limit}. It resets at midnight UTC.`,
    );
  }
}

/** Verifies the caller and consumes one unit of today's quota. Returns the uid. */
export async function guardAiCall(idToken: unknown, feature: AiFeature): Promise<string> {
  const uid = await verifyUser(idToken);
  await consumeQuota(uid, feature);
  return uid;
}

/** Wraps a guarded AI call so the client always gets a readable result. */
export async function runGuarded<T>(
  idToken: unknown,
  feature: AiFeature,
  fn: () => Promise<T>,
): Promise<AiResult<T>> {
  try {
    await guardAiCall(idToken, feature);
    return { ok: true, data: await fn() };
  } catch (error: any) {
    if (error instanceof AiGuardError) {
      return { ok: false, code: error.code, message: error.message };
    }
    console.error(`[MiinPlanner ${feature}] AI call failed:`, error?.message || error);
    return { ok: false, code: 'failed', message: "The AI service didn't respond. Please try again in a moment." };
  }
}
