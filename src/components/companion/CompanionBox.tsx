"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MOOD_LABEL, type Mood } from "@/lib/companion";
import { CompanionAvatar } from "./CompanionAvatar";
import { useCompanion } from "./use-companion";

export const MOOD_TONE: Record<Mood, string> = {
  hello: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  sad: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  worried: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  okay: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  happy: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  love: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Small companion card for the Task Manager: live mood, score and the day's greeting. */
export function CompanionBox({ className }: { className?: string }) {
  const { companion, momentum, line } = useCompanion();
  return (
    <Card className={cn("shadow-sm border", className)}>
      <CardContent className="p-4 flex gap-3 items-start">
        <Link href="/companion" aria-label={`Open ${companion.name}, your companion`} className="shrink-0">
          <CompanionAvatar
            key={momentum.mood}
            companion={companion.id}
            mood={momentum.mood}
            size={60}
            title={`${companion.name} is ${MOOD_LABEL[momentum.mood].toLowerCase()}`}
            className="animate-in zoom-in-75 duration-500"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{companion.name}</span>
            <span className={cn("text-[11px] font-medium rounded-full px-2 py-0.5", MOOD_TONE[momentum.mood])}>
              {MOOD_LABEL[momentum.mood]}
            </span>
            <span className="ml-auto text-sm tabular-nums" title="Momentum score">
              {momentum.score === null ? <span className="text-muted-foreground">New</span> : <><span className="font-bold">{momentum.score}</span><span className="text-muted-foreground">/100</span></>}
            </span>
          </div>
          <p className="text-sm mt-1 leading-snug">{line}</p>
          <Link href="/companion" className="text-xs font-medium text-primary hover:underline mt-1.5 inline-block">
            Check in with {companion.name}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
