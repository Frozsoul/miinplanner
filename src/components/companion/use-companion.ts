"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { companionCheckIn, type CheckInOutput } from "@/ai/flows/companion-checkin-flow";
import {
  computeMomentum, firstNameOf, getCompanion, greeting, watchList, type CompanionId,
} from "@/lib/companion";

export interface SavedCheckIn extends CheckInOutput {
  day: string;
  companionId: CompanionId;
  at: number;
}

const CHECKIN_KEY = "mp.lastCheckIn";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readCheckIn(): SavedCheckIn | null {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedCheckIn;
    return saved.day === today() ? saved : null;
  } catch {
    return null;
  }
}

/** The user's companion, its live mood and greeting, and the AI check-in. */
export function useCompanion() {
  const { tasks, isTaskDone } = useAppData();
  const { user, userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const companion = getCompanion(userProfile?.companionId);
  const firstName = firstNameOf(userProfile?.displayName || user?.displayName, user?.email);
  const momentum = useMemo(() => computeMomentum(tasks, isTaskDone), [tasks, isTaskDone]);
  const watch = useMemo(() => watchList(tasks, isTaskDone), [tasks, isTaskDone]);
  const line = greeting(companion.id, momentum, firstName);

  const [checkIn, setCheckIn] = useState<SavedCheckIn | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  useEffect(() => { setCheckIn(readCheckIn()); }, []);

  const chooseCompanion = useCallback(async (id: CompanionId) => {
    try {
      await updateUserProfile({ companionId: id });
      toast({ title: `${getCompanion(id).name} is your companion now` });
    } catch {
      toast({ title: "Could not switch companion", description: "Please try again.", variant: "destructive" });
    }
  }, [updateUserProfile, toast]);

  const askForCheckIn = useCallback(async () => {
    if (!user) return;
    setIsCheckingIn(true);
    try {
      const items = [...watch.soon, ...watch.stalled].slice(0, 15).map(({ task, when }) => ({
        title: task.title.slice(0, 200),
        priority: task.priority,
        when,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : undefined,
      }));
      const idToken = await user.getIdToken();
      const result = await companionCheckIn(idToken, {
        companionId: companion.id,
        firstName: firstName.slice(0, 40),
        score: momentum.score,
        mood: momentum.mood,
        finishedWeek: momentum.finishedWeek,
        finishedToday: momentum.finishedToday,
        activeDays: Math.min(momentum.activeDays, 7),
        overdue: momentum.overdue,
        dueToday: momentum.dueToday,
        openTotal: watch.openTotal,
        tasks: items,
        currentDate: new Date().toDateString(),
      });
      if (!result.ok) {
        toast({
          title: result.code === "limit_reached" ? `${companion.name} needs a break` : "Check-in unavailable",
          description: result.code === "limit_reached" ? "You've had today's 3 check-ins. More tomorrow." : result.message,
          variant: "destructive",
        });
        return;
      }
      const saved: SavedCheckIn = { ...result.data, day: today(), companionId: companion.id, at: Date.now() };
      setCheckIn(saved);
      try { localStorage.setItem(CHECKIN_KEY, JSON.stringify(saved)); } catch { /* per-browser convenience only */ }
    } catch (error) {
      console.error("Companion check-in failed:", error);
      toast({ title: "Check-in unavailable", description: "Couldn't reach the AI service. Please try again.", variant: "destructive" });
    } finally {
      setIsCheckingIn(false);
    }
  }, [user, watch, companion, firstName, momentum, toast]);

  return { companion, firstName, momentum, watch, line, checkIn, isCheckingIn, askForCheckIn, chooseCompanion };
}
