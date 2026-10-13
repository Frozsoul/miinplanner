"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const REMINDERS_SETUP_KEY = "reminders-setup";
const DISMISS_KEY = "reminders-banner-dismissed-at";
const SNOOZE_DAYS = 7;

/**
 * Nudges people to put their due dates in their phone calendar. Hidden once they have
 * opened Settings > Reminders, and snoozed for a week when they click "Not now".
 */
export function RemindersBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(REMINDERS_SETUP_KEY)) return;
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < SNOOZE_DAYS * 24 * 60 * 60 * 1000) return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-sidebar-primary/40 bg-sidebar-primary/10 p-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
        <Bell className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Never miss a due date</p>
        <p className="text-sm text-muted-foreground">
          Add your tasks to Google, Apple or Outlook Calendar. Your phone reminds you at 9am on the day each one is due.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/settings/reminders">Turn on reminders</Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Not now">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
