import type { Task } from "@/types";
import { dueBucket, finishedTime } from "@/lib/task-buckets";
import { slippedRecently } from "@/lib/slips";

/**
 * The companion: a personality that keeps you company on your board. Its mood follows a
 * momentum score worked out in code from the board's tasks (never stored, never AI), so it
 * is instant, free and the same everywhere. The AI is only used for short check-ins.
 */

export type CompanionId = "kai" | "mia" | "theo" | "pip";
export type Mood = "hello" | "sad" | "worried" | "okay" | "happy" | "love";

export interface Companion {
  id: CompanionId;
  name: string;
  role: string;
  blurb: string;
  /** Sent to the model so check-ins sound like this companion. */
  voice: string;
}

export const COMPANIONS: Companion[] = [
  {
    id: "mia",
    name: "Miin Buddy",
    role: "Warm and supportive",
    blurb: "Always in your corner. Cheers every step.",
    voice: "Warm, caring and casual, like a close friend who believes in them. Encouraging, never preachy. Celebrates progress and is gentle about slips.",
  },
  {
    id: "kai",
    name: "Miin Coach",
    role: "Strict and direct",
    blurb: "Holds you to your plan. No excuses.",
    voice: "A strict, no-nonsense coach. Short, firm sentences. Names the one thing to do next. Praise is brief and earned. Tough but fair, never insulting.",
  },
  {
    id: "theo",
    name: "Miin Mentor",
    role: "Calm and wise",
    blurb: "Big picture first. Keeps you steady.",
    voice: "A calm, experienced mentor. Thoughtful and steady. Puts the week in perspective and suggests what matters most. Never rushed.",
  },
  {
    id: "pip",
    name: "Miin Hype",
    role: "Playful and loud",
    blurb: "Turns every win into a party.",
    voice: "A playful, high-energy hype buddy. Fun, upbeat, a little cheeky. May use one emoji. Turns even small wins into a celebration.",
  },
];

export const DEFAULT_COMPANION: CompanionId = "mia";

export function getCompanion(id?: string | null): Companion {
  return COMPANIONS.find(c => c.id === id) || COMPANIONS.find(c => c.id === DEFAULT_COMPANION)!;
}

export interface Momentum {
  /** 0 to 100, or null until the first task is finished. */
  score: number | null;
  mood: Mood;
  finishedWeek: number;
  finishedToday: number;
  activeDays: number;
  overdue: number;
  dueToday: number;
  /** Open tasks whose due date was pushed later in the last 7 days. */
  slipsWeek: number;
  parts: { delivery: number; consistency: number; today: number };
}

const DAY = 24 * 60 * 60 * 1000;

function localDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Momentum score, out of 100:
 * - Delivery (50): tasks finished in the last 7 days against what is overdue or was pushed.
 *   Finishing 3 with nothing overdue is full marks. A task pushed later this week counts as
 *   half an overdue task (src/lib/slips.ts), so moving dates can't hide slipping work.
 * - Consistency (30): days in the last 7 with at least one task finished. 4 days is full marks.
 * - Today (20): something finished today, or 10 when nothing is overdue.
 */
export function computeMomentum(tasks: Task[], isDone: (t: Task) => boolean, now: Date = new Date()): Momentum {
  const live = tasks.filter(t => !t.archived);
  const open = live.filter(t => !isDone(t));
  const finished = tasks.filter(t => isDone(t));
  const weekAgo = now.getTime() - 7 * DAY;
  const today = localDay(now.getTime());

  const finishedTimes = finished.map(finishedTime).filter(t => t >= weekAgo && t <= now.getTime() + DAY);
  const finishedWeek = finishedTimes.length;
  const finishedToday = finishedTimes.filter(t => localDay(t) === today).length;
  const activeDays = new Set(finishedTimes.map(localDay)).size;
  const overdue = open.filter(t => dueBucket(t, now) === "overdue").length;
  const dueToday = open.filter(t => dueBucket(t, now) === "today").length;
  const slipsWeek = slippedRecently(tasks, isDone, now).length;

  const target = Math.max(3, finishedWeek + overdue + slipsWeek / 2);
  const delivery = Math.round((50 * finishedWeek) / target);
  const consistency = Math.round((30 * Math.min(activeDays, 4)) / 4);
  const todayPts = finishedToday > 0 ? 20 : overdue === 0 ? 10 : 0;
  const parts = { delivery, consistency, today: todayPts };

  if (finished.length === 0) {
    return { score: null, mood: "hello", finishedWeek, finishedToday, activeDays, overdue, dueToday, slipsWeek, parts };
  }
  const score = Math.max(0, Math.min(100, delivery + consistency + todayPts));
  return { score, mood: moodFor(score), finishedWeek, finishedToday, activeDays, overdue, dueToday, slipsWeek, parts };
}

export function moodFor(score: number): Mood {
  if (score >= 90) return "love";
  if (score >= 70) return "happy";
  if (score >= 50) return "okay";
  if (score >= 25) return "worried";
  return "sad";
}

export const MOOD_LABEL: Record<Mood, string> = {
  hello: "Just met",
  sad: "Sad",
  worried: "Worried",
  okay: "Okay",
  happy: "Happy",
  love: "Loving it",
};

type Lines = Record<Mood, string[]>;

/** Free, instant one-liners. {name} is the user's first name, {overdue} and {week} are counts. */
const GREETINGS: Record<CompanionId, Lines> = {
  mia: {
    hello: ["Hi {name}! I'm your Miin Buddy. Finish your first task and I'll start cheering.", "Hey {name}, so glad you're here. Let's tick off one thing together."],
    sad: ["I miss seeing you tick things off, {name}. One small task today?", "Rough week? No judgement. Let's pick one easy win."],
    worried: ["{overdue} overdue, {name}. Let's sort one out and breathe.", "Things are piling up a bit. I'm here, let's start small."],
    okay: ["Steady work, {name}. A couple more and I'll be beaming.", "You're doing fine. One more today would make my day."],
    happy: ["Look at you go, {name}! {week} done this week.", "Love this rhythm. Keep it going!"],
    love: ["{name}, you're on fire. I'm so proud of you!", "{week} done this week. Honestly, you're amazing."],
  },
  kai: {
    hello: ["I'm your Miin Coach. Finish one task and we start keeping score.", "{name}. Pick a task. Finish it. Then we talk."],
    sad: ["{name}, nothing moved this week. Pick one task. Do it now.", "No excuses today. One task, start to finish."],
    worried: ["{overdue} overdue. Clear the oldest one first.", "You're slipping, {name}. Fix one overdue task today."],
    okay: ["Not bad. Not good enough yet. Finish one more.", "Average week so far. Push."],
    happy: ["Good work, {name}. {week} done. Keep the pace.", "Solid. Don't let up now."],
    love: ["That's how it's done, {name}. Respect.", "{week} this week. Exactly the standard."],
  },
  theo: {
    hello: ["Welcome, {name}. Start with one task that matters. I'll keep an eye on the rest.", "Good to meet you. Every plan starts with a single finished task."],
    sad: ["Quiet week, {name}. That happens. Choose one thing that matters and begin there.", "Let's reset gently. What's the one task that would make today count?"],
    worried: ["{overdue} tasks have slipped. Clear one, then reschedule the rest honestly.", "The list is ahead of you right now. Small steps bring it back."],
    okay: ["A steady pace, {name}. Protect time for your most important task.", "You're moving. Now make sure it's in the right direction."],
    happy: ["Good momentum, {name}. {week} done this week.", "This is a healthy rhythm. Keep it sustainable."],
    love: ["Excellent week, {name}. This is what consistency looks like.", "{week} done and nothing slipping. Well earned."],
  },
  pip: {
    hello: ["Yo {name}! I'm Miin Hype. Finish a task and I'll throw a party 🎉", "New buddy alert! Let's smash the first task."],
    sad: ["Psst, {name}... the board misses you. One quick win?", "Zero wins this week?! Let's fix that right now."],
    worried: ["Uh oh, {overdue} overdue. Let's squash one!", "The overdue pile is staring at me, {name}. Help!"],
    okay: ["Not bad, {name}! One more and I start dancing.", "We're warming up. Keep going!"],
    happy: ["{week} done! You're on a roll, {name}!", "Yes yes YES. Keep it coming!"],
    love: ["LEGEND. {week} this week, {name}! 🏆", "Absolute machine. I can't stop smiling."],
  },
};

function pick<T>(items: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return items[h % items.length];
}

/** Used instead of the mood line when work was pushed this week and the mood would sound too rosy. {slips} is the count. */
const SLIP_LINES: Record<CompanionId, string[]> = {
  mia: ["{week} done, nice! But {slips} got pushed to later this week. Fine if planned, {name}, just don't let them pile up.", "You moved {slips} to later, {name}. No stress, let's make sure they actually happen."],
  kai: ["{week} done. {slips} pushed. Pushed isn't done, {name}.", "{slips} moved to later this week. Finish them on the new date. No second push."],
  theo: ["{week} done this week, and {slips} moved to later. Worth asking: was the plan too full, or did priorities change?", "Moving dates is honest planning once. {slips} pushed this week, {name}. Keep the new dates realistic."],
  pip: ["{week} wins! Buuut {slips} got bumped to later 👀 Let's not make it a habit, {name}.", "Sneaky {slips} pushed to later! I see you, {name}. Let's crush them on the new date."],
};

/** The day's greeting for this companion and mood. Stable for the day, changes with the mood. */
export function greeting(companion: CompanionId, m: Momentum, firstName: string, now: Date = new Date()): string {
  const seed = `${localDay(now.getTime())}-${m.mood}`;
  // A rosy line would hide pushed work, so name it instead.
  const rosy = m.mood === "okay" || m.mood === "happy" || m.mood === "love";
  const line = rosy && m.slipsWeek > 0
    ? pick(SLIP_LINES[companion], `${seed}-slip`)
    : pick(GREETINGS[companion][m.mood], seed);
  return line
    .replace(/\{name\}/g, firstName || "friend")
    .replace(/\{overdue\}/g, String(m.overdue))
    .replace(/\{week\}/g, String(m.finishedWeek))
    .replace(/\{slips\}/g, m.slipsWeek === 1 ? "1 task" : `${m.slipsWeek} tasks`);
}

export function firstNameOf(displayName?: string | null, email?: string | null): string {
  const raw = (displayName || "").trim().split(/\s+/)[0] || (email || "").split("@")[0] || "";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
}

export type WatchWhen = "overdue" | "today" | "week" | "stalled";

/**
 * What the companion keeps an eye on: open tasks that are overdue, due today or within
 * 7 days (most urgent first), and open tasks with no update for over 7 days.
 */
export function watchList(tasks: Task[], isDone: (t: Task) => boolean, now: Date = new Date()) {
  const open = tasks.filter(t => !t.archived && !isDone(t));
  const rank = { overdue: 0, today: 1, week: 2 } as Record<string, number>;
  const soon = open
    .filter(t => dueBucket(t, now) in rank)
    .sort((a, b) => rank[dueBucket(a, now)] - rank[dueBucket(b, now)] || (a.dueDate || "").localeCompare(b.dueDate || ""))
    .map(t => ({ task: t, when: dueBucket(t, now) as WatchWhen }));
  const soonIds = new Set(soon.map(s => s.task.id));
  const stalled = open
    .filter(t => !soonIds.has(t.id))
    .filter(t => {
      const updated = t.updatedAt?.toDate ? t.updatedAt.toDate().getTime() : null;
      return updated !== null && updated < now.getTime() - 7 * DAY;
    })
    .map(t => ({ task: t, when: "stalled" as WatchWhen }));
  return { soon, stalled, openTotal: open.length };
}
