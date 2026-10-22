"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { syncDigestAction } from "@/services/email-digest-actions";

const SYNC_KEY = "miinplanner-digest-sync";

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Once per browser session, tells the server the user's time zone and that they're active,
 * so the daily email goes out at their local morning and stops if they stop using the app.
 * Renders nothing and never blocks the page.
 */
export function DigestSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const key = `${SYNC_KEY}:${user.uid}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {}
    (async () => {
      const result = await syncDigestAction(await user.getIdToken(), browserTimeZone()).catch(() => null);
      if (result?.ok) {
        try { sessionStorage.setItem(key, "1"); } catch {}
      }
    })();
  }, [user]);
  return null;
}
