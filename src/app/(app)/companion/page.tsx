"use client";

import Link from "next/link";
import { Loader2, Smile, MessageCircleHeart, Check, AlertTriangle, PauseCircle, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletionChart } from "@/components/charts/CompletionChart";
import { InsightsChat } from "@/components/insights/InsightsChat";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { MOOD_TONE } from "@/components/companion/CompanionBox";
import { useCompanion } from "@/components/companion/use-companion";
import { useAppData } from "@/contexts/app-data-context";
import { useAuth } from "@/contexts/auth-context";
import { COMPANIONS, MOOD_LABEL, type WatchWhen } from "@/lib/companion";
import { cn } from "@/lib/utils";

const WHEN_LABEL: Record<WatchWhen, string> = { overdue: "Overdue", today: "Today", week: "This week", stalled: "No update for 7+ days" };
const WHEN_TONE: Record<WatchWhen, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  week: "text-muted-foreground",
  stalled: "text-muted-foreground",
};

function ScoreRing({ score }: { score: number | null }) {
  const value = score ?? 0;
  return (
    <div className="relative h-24 w-24 shrink-0" title="Momentum score">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" className="stroke-muted" />
        <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round"
          className="stroke-primary transition-all duration-700" strokeDasharray={`${value} 100`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score ?? "New"}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{score === null ? "score" : "of 100"}</span>
      </div>
    </div>
  );
}

function Part({ label, value, max, hint }: { label: string; value: number; max: number; hint: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}

export default function CompanionPage() {
  const { loading: authLoading } = useAuth();
  const { tasks, completionHistory } = useAppData();
  const { companion, momentum, watch, line, checkIn, isCheckingIn, askForCheckIn, chooseCompanion } = useCompanion();

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const freshCheckIn = checkIn && checkIn.companionId === companion.id ? checkIn : null;
  const watching = [...watch.soon, ...watch.stalled];

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Companion"
        description={`${companion.name} keeps you company on your board. Finish tasks on time to keep ${companion.name} happy.`}
        icon={Smile}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero: face, score, greeting and check-in */}
        <Card className="shadow-sm border overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex flex-col items-center gap-2">
              <CompanionAvatar
                key={momentum.mood}
                companion={companion.id}
                mood={momentum.mood}
                size={148}
                title={`${companion.name} is ${MOOD_LABEL[momentum.mood].toLowerCase()}`}
                className="animate-in zoom-in-75 duration-500"
              />
              <div className="text-center">
                <p className="font-semibold text-lg leading-tight">{companion.name}</p>
                <p className="text-xs text-muted-foreground">{companion.role}</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={momentum.score} />
                <div>
                  <span className={cn("text-xs font-medium rounded-full px-2.5 py-1", MOOD_TONE[momentum.mood])}>
                    {MOOD_LABEL[momentum.mood]}
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">
                    {momentum.score === null
                      ? "Your score starts when you finish your first task."
                      : `${momentum.finishedWeek} finished this week, ${momentum.overdue} overdue.`}
                  </p>
                </div>
              </div>

              <div className="relative rounded-2xl rounded-tl-sm bg-muted/60 border p-4">
                {freshCheckIn ? (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    <p className="leading-relaxed">{freshCheckIn.message}</p>
                    {freshCheckIn.nextSteps.length > 0 && (
                      <ul className="space-y-1.5">
                        {freshCheckIn.nextSteps.map((step, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <Check className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Checked in at {new Date(freshCheckIn.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ) : (
                  <p className="leading-relaxed">{line}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={askForCheckIn} disabled={isCheckingIn}>
                  {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircleHeart className="mr-2 h-4 w-4" />}
                  {isCheckingIn ? `${companion.name} is looking at your board...` : `Check in with ${companion.name}`}
                </Button>
                <span className="text-xs text-muted-foreground">Up to 3 check-ins a day. {companion.name} reads your board and replies in a few lines.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* How the score works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How your score works</CardTitle>
              <CardDescription>Worked out from your board, live. Finish tasks on time and {companion.name} cheers up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Part label="Getting things done" value={momentum.parts.delivery} max={50}
                hint="Tasks finished in the last 7 days against what's overdue. 3 finished and nothing overdue is full marks." />
              <Part label="Showing up" value={momentum.parts.consistency} max={30}
                hint={`Days this week you finished something: ${momentum.activeDays} of 4 needed.`} />
              <Part label="Today" value={momentum.parts.today} max={20}
                hint="Finish something today for full marks. Nothing overdue gives half." />
            </CardContent>
          </Card>

          {/* What I'm watching */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What {companion.name} is watching</CardTitle>
              <CardDescription>Overdue, due this week, or not touched for over a week.</CardDescription>
            </CardHeader>
            <CardContent>
              {watching.length > 0 ? (
                <ul className="divide-y">
                  {watching.slice(0, 8).map(({ task, when }) => (
                    <li key={task.id} className="py-2 flex items-center gap-3">
                      {when === "overdue" ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        : when === "stalled" ? <PauseCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="text-sm truncate flex-1">{task.title}</span>
                      <span className={cn("text-xs font-medium whitespace-nowrap", WHEN_TONE[when])}>{WHEN_LABEL[when]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing slipping. {tasks.length === 0 ? "Add a task to get started." : "Nice and calm."}</p>
              )}
              {watching.length > 8 && <p className="text-xs text-muted-foreground mt-2">and {watching.length - 8} more</p>}
              <Button variant="outline" size="sm" className="mt-4" asChild><Link href="/tasks">Open Task Manager</Link></Button>
            </CardContent>
          </Card>
        </div>

        {/* Choose a companion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose your companion</CardTitle>
            <CardDescription>Same score, different personality. Switch any time.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPANIONS.map(c => {
              const chosen = c.id === companion.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => !chosen && chooseCompanion(c.id)}
                  aria-pressed={chosen}
                  className={cn(
                    "text-left rounded-lg border p-4 flex flex-col items-center gap-2 transition-colors",
                    chosen ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <CompanionAvatar companion={c.id} mood="happy" size={80} title={c.name} />
                  <div className="text-center">
                    <p className="font-semibold">{c.name} {chosen && <span className="ml-1 align-middle text-[11px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">Yours</span>}</p>
                    <p className="text-xs font-medium text-muted-foreground">{c.role}</p>
                    <p className="text-sm mt-1">{c.blurb}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <CompletionChart data={completionHistory} />

        <InsightsChat tasks={tasks} />
      </div>
    </div>
  );
}
