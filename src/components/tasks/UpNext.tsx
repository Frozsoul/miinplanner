"use client";

import Link from "next/link";
import type { Task } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Library, PlusCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/app-data-context";
import { compareByUrgency, dueBucket, dueTime } from "@/lib/task-buckets";

const DOT: Record<string, string> = {
  Urgent: "bg-red-500", High: "bg-orange-500", Medium: "bg-sky-500", Low: "bg-slate-400",
};

function dueLabel(task: Task, now: Date): { text: string; tone: string } {
  const bucket = dueBucket(task, now);
  if (bucket === "overdue") return { text: "Overdue", tone: "text-red-600 dark:text-red-400" };
  if (bucket === "today") return { text: "Today", tone: "text-amber-600 dark:text-amber-400" };
  const t = dueTime(task);
  return { text: t ? new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "", tone: "text-muted-foreground" };
}

/**
 * "Up next": the 3 open tasks that need attention first (overdue, today, next 7 days),
 * with a one-click finish. Answers "where do I start" above every view.
 */
export function UpNext({ tasks, onView, className }: { tasks: Task[]; onView: (task: Task) => void; className?: string }) {
  const { isTaskDone, doneStatus, updateTaskField } = useAppData();
  const now = new Date();
  const open = tasks.filter(t => !t.archived && !isTaskDone(t));
  if (open.length === 0) return null;

  const counts = { overdue: 0, today: 0, week: 0 };
  open.forEach(t => {
    const b = dueBucket(t, now);
    if (b === "overdue" || b === "today" || b === "week") counts[b]++;
  });
  const soon = open
    .filter(t => ["overdue", "today", "week"].includes(dueBucket(t, now)))
    .sort((a, b) => compareByUrgency(a, b, now))
    .slice(0, 3);

  const summary = [
    counts.overdue ? `${counts.overdue} overdue` : "",
    counts.today ? `${counts.today} due today` : "",
    counts.week ? `${counts.week} in the next 7 days` : "",
  ].filter(Boolean).join(" · ");

  return (
    <Card className={cn("mb-6 shadow-sm border", className)}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Up next</h2>
          <p className="text-sm text-muted-foreground">{summary || "Nothing due in the next 7 days."}</p>
        </div>
        {soon.length > 0 ? (
          <ul className="grid gap-2 md:grid-cols-3">
            {soon.map(task => {
              const due = dueLabel(task, now);
              return (
                <li key={task.id} className="flex items-start gap-3 rounded-md border bg-background p-3">
                  <Checkbox
                    className="mt-0.5"
                    aria-label={`Mark "${task.title}" as finished`}
                    disabled={!doneStatus}
                    onCheckedChange={(checked) => { if (checked && doneStatus) updateTaskField(task.id, "status", doneStatus); }}
                  />
                  <div className="min-w-0">
                    <button type="button" onClick={() => onView(task)} className="text-sm font-medium text-left hover:underline line-clamp-2">
                      {task.title}
                    </button>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={cn("h-2 w-2 rounded-full", DOT[task.priority])} aria-hidden="true" />
                      <span className="text-muted-foreground">{task.priority}</span>
                      <span className={cn("font-medium", due.tone)}>{due.text}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            You're clear for the week. Pick something from Later, or plan what's next.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** First-run state for an empty board: three ways to get going. */
export function EmptyBoardWelcome({ onAddTask }: { onAddTask: () => void }) {
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-headline font-bold">Welcome to MiinPlanner</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Your board is empty. Start with one task, paste a plan from ChatGPT, Claude or Gemini, or pick a ready-made playbook.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button onClick={onAddTask}><PlusCircle className="mr-2 h-4 w-4" />Add a task</Button>
          <Button variant="outline" asChild><Link href="/planner"><Sparkles className="mr-2 h-4 w-4" />Paste a plan</Link></Button>
          <Button variant="outline" asChild><Link href="/library"><Library className="mr-2 h-4 w-4" />Browse playbooks</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
