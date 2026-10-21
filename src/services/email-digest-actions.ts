'use server';

/**
 * @fileOverview Server actions for the daily email digest.
 *
 * Settings live in `emailDigests/{uid}` (server-only: no Firestore rule matches it).
 * The digest is on for everyone by default; the app records the user's time zone and
 * last visit on each session so the email goes out at the right local time and stops
 * for people who stopped using the app. Sending: `src/app/api/digest/run/route.ts`.
 */

import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, uidFromIdToken } from '@/lib/firebase-admin';
import { cleanDigestTime, cleanTimeZone, DEFAULT_DIGEST_TIME } from '@/lib/email-digest';

export interface DigestSettings {
  enabled: boolean;
  sendAt: string;
  timeZone: string;
}

export type DigestActionResult =
  | { ok: true; data: DigestSettings }
  | { ok: false; message: string };

const SESSION_EXPIRED = 'Your session expired. Please sign in again.';
const SERVER_ERROR = 'Something went wrong on our side. Please try again in a moment.';

function settingsFrom(data: FirebaseFirestore.DocumentData | undefined, timeZone: string): DigestSettings {
  return {
    enabled: data?.enabled !== false,
    sendAt: cleanDigestTime(data?.sendAt),
    timeZone: data?.timeZone || timeZone,
  };
}

/**
 * Called once per session: creates the digest record on first use (on by default),
 * keeps the time zone current and records the visit. Never turns a digest back on.
 */
export async function syncDigestAction(idToken: string, timeZone: string): Promise<DigestActionResult> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  const tz = cleanTimeZone(timeZone);
  try {
    const ref = adminDb().collection('emailDigests').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        uid,
        enabled: true,
        sendAt: DEFAULT_DIGEST_TIME,
        timeZone: tz,
        unsubToken: randomBytes(24).toString('base64url'),
        lastSeenAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, data: { enabled: true, sendAt: DEFAULT_DIGEST_TIME, timeZone: tz } };
    }
    await ref.update({ timeZone: tz, lastSeenAt: FieldValue.serverTimestamp() });
    return { ok: true, data: settingsFrom(snap.data(), tz) };
  } catch (error) {
    console.error('syncDigestAction failed:', error);
    return { ok: false, message: SERVER_ERROR };
  }
}

/** Turns the digest on or off and sets the local send time. */
export async function updateDigestAction(
  idToken: string,
  update: { enabled: boolean; sendAt: string; timeZone: string },
): Promise<DigestActionResult> {
  const uid = await uidFromIdToken(idToken);
  if (!uid) return { ok: false, message: SESSION_EXPIRED };
  const tz = cleanTimeZone(update.timeZone);
  const sendAt = cleanDigestTime(update.sendAt);
  const enabled = update.enabled === true;
  try {
    const ref = adminDb().collection('emailDigests').doc(uid);
    const snap = await ref.get();
    await ref.set(
      {
        uid,
        enabled,
        sendAt,
        timeZone: tz,
        lastSeenAt: FieldValue.serverTimestamp(),
        ...(snap.exists && snap.get('unsubToken') ? {} : { unsubToken: randomBytes(24).toString('base64url') }),
        ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    return { ok: true, data: { enabled, sendAt, timeZone: tz } };
  } catch (error) {
    console.error('updateDigestAction failed:', error);
    return { ok: false, message: SERVER_ERROR };
  }
}
