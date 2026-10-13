'use server';

/**
 * @fileOverview Server actions for the private calendar feed.
 *
 * Each user can have one secret feed link. The token lives in `calendarFeeds/{token}`
 * (server-only: no Firestore rule matches it, so clients can't read or write it).
 * The feed itself is served by `src/app/api/calendar/[token]/route.ts`.
 */

import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, uidFromIdToken } from '@/lib/firebase-admin';

export type FeedActionResult =
  | { ok: true; data: { token: string } }
  | { ok: false; message: string };

const SESSION_EXPIRED = 'Your session expired. Please sign in again.';
const SERVER_ERROR = 'Something went wrong on our side. Please try again in a moment.';

function cleanTimeZone(tz: unknown): string {
  if (typeof tz !== 'string' || tz.length > 64) return 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

function newToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Returns the caller's feed token, creating one on first use. Keeps the time zone current. */
export async function getCalendarFeedAction(idToken: string, timeZone: string): Promise<FeedActionResult> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  const tz = cleanTimeZone(timeZone);
  try {
    const db = adminDb();
    const existing = await db.collection('calendarFeeds').where('uid', '==', uid).limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      if (doc.get('timeZone') !== tz) await doc.ref.update({ timeZone: tz });
      return { ok: true, data: { token: doc.id } };
    }
    const token = newToken();
    await db.collection('calendarFeeds').doc(token).set({ uid, timeZone: tz, createdAt: FieldValue.serverTimestamp() });
    return { ok: true, data: { token } };
  } catch (error) {
    console.error('getCalendarFeedAction failed:', error);
    return { ok: false, message: SERVER_ERROR };
  }
}

/** Replaces the caller's feed link. The old link stops working immediately. */
export async function resetCalendarFeedAction(idToken: string, timeZone: string): Promise<FeedActionResult> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  try {
    const db = adminDb();
    const existing = await db.collection('calendarFeeds').where('uid', '==', uid).get();
    const token = newToken();
    const batch = db.batch();
    existing.docs.forEach(d => batch.delete(d.ref));
    batch.set(db.collection('calendarFeeds').doc(token), {
      uid,
      timeZone: cleanTimeZone(timeZone),
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { ok: true, data: { token } };
  } catch (error) {
    console.error('resetCalendarFeedAction failed:', error);
    return { ok: false, message: SERVER_ERROR };
  }
}
