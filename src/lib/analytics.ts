"use client";

import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { app } from "@/lib/firebase";

// Firebase Analytics (GA4). Client only: it needs `window` and is not
// supported in every browser, so it loads lazily and fails silently.
let analyticsPromise: Promise<Analytics | null> | null = null;

function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((ok) => (ok ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

/** Starts Analytics so GA4 records page views. Safe to call more than once. */
export function initAnalytics(): void {
  void getClientAnalytics();
}

/** Logs a GA4 event. Never throws and never blocks the caller. */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  getClientAnalytics()
    .then((analytics) => {
      if (analytics) logEvent(analytics, name, params);
    })
    .catch(() => {});
}

/**
 * Logs `first_task_added` once per user, the first time they add a task to an
 * empty board. A localStorage flag stops repeats on this browser.
 */
export function trackFirstTask(uid: string, boardWasEmpty: boolean, source: "manual" | "plan_import"): void {
  if (typeof window === "undefined" || !boardWasEmpty) return;
  const key = `miin_first_task_logged_${uid}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: still log, at worst once per session.
  }
  trackEvent("first_task_added", { source });
}
