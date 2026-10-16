'use server';

/**
 * @fileOverview How many AI uses are left today, read from the server-side counter
 * (`aiUsage/{uid}`, written by src/ai/guard.ts). Reading does not use up any quota.
 */

import { adminDb, uidFromIdToken } from '@/lib/firebase-admin';
import { AI_DAILY_LIMITS, type AiFeature } from '@/ai/guard';

export type UsageLeftResult =
  | { ok: true; data: { left: number; limit: number } }
  | { ok: false; message: string };

const FEATURES: AiFeature[] = ['plan', 'chat', 'insights', 'checkin'];

export async function getAiUsageLeft(idToken: string, feature: AiFeature): Promise<UsageLeftResult> {
  if (!FEATURES.includes(feature)) return { ok: false, message: 'Unknown feature.' };
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: 'Your session expired. Please sign in again.' };
  const limit = AI_DAILY_LIMITS[feature];
  try {
    const snap = await adminDb().collection('aiUsage').doc(uid).get();
    const data = snap.exists ? snap.data() ?? {} : {};
    const today = new Date().toISOString().slice(0, 10);
    const used = data.date === today ? Number(data[feature] || 0) : 0;
    return { ok: true, data: { left: Math.max(0, limit - used), limit } };
  } catch (error: any) {
    console.error('[MiinPlanner aiUsage] Could not read usage:', error?.message || error);
    return { ok: false, message: "Couldn't read today's usage." };
  }
}
