"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Task } from "@/types";
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, isValid, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { PRIORITY_PILL, PRIORITY_STRIPE } from "@/lib/task-colors";
import { compareByUrgency } from "@/lib/task-buckets";
import { useAppData } from "@/contexts/app-data-context";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HIDE_DONE_KEY = "mp.calendarHideDone";

/** Soft background per priority for the pills inside day cells. */
const PILL_BG: Record<string, string> = {
  Urgent: "bg-red-50 dark:bg-red-500/10",
  High: "bg-orange-50 dark:bg-orange-500/10",
  Medium: "bg-sky-50 dark:bg-sky-500/10",
  Low: "bg-slate-50 dark:bg-slate-500/10",
};
const DOT: Record<string, string> = {
  Urgent: "bg-red-500", High: "bg-orange-500", Medium: "bg-sky-500", Low: "bg-slate-400",
};

const parseTaskDate = (date: unknown): Date | undefined => {
  if (!date) return undefined;
  if (typeof date === "string") {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : undefined;
  }
  if (typeof (date as { toDate?: unknown }).toDate === "function") return (date as { toDate: () => Date }).toDate();
  if (date instanceof Date && isValid(date)) return date;
  return undefined;
};

/** The day a task sits on: its due date, or its start date when it has no due date. */
const taskDay = (task: Task): Date | undefined => parseTaskDate(task.dueDate) ?? parseTaskDate(task.startDate);

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const { isTaskDone } = useAppData();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [hideDone, setHideDone] = useState(true);

  useEffect(() => {
    try { if (window.localStorage.getItem(HIDE_DONE_KEY) === "false") setHideDone(false); } catch { /* storage blocked */ }
  }, []);
  const toggleHideDone = (value: boolean) => {
    setHideDone(value);
    try { window.localStorage.setItem(HIDE_DONE_KEY, String(value)); } catch { /* storage blocked */ }
  };

  const today = startOfDay(new Date());
  const visible = useMemo(
    () => tasks.filter(t => !t.archived && !(hideDone && isTaskDone(t))),
    [tasks, hideDone, isTaskDone],
  );

  // Tasks per day, open work first (overdue, today, soon, by priority), finished at the end.
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    visible.forEach(t => {
      const d = taskDay(t);
      if (!d) return;
      const key = format(d, "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), t]);
    });
    const now = new Date();
    map.forEach(list => list.sort((a, b) => {
      const da = isTaskDone(a) ? 1 : 0, db = isTaskDone(b) ? 1 : 0;
      return da !== db ? da - db : compareByUrgency(a, b, now);
    }));
    return map;
  }, [visible, isTaskDone]);

  const tasksOn = (day: Date) => byDay.get(format(day, "yyyy-MM-dd")) || [];
  const isOverdue = (t: Task) => {
    const d = taskDay(t);
    return !!d && !isTaskDone(t) && startOfDay(d) < today;
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const offset = getDay(startOfMonth(currentMonth));
  const trailing = (7 - ((offset + days.length) % 7)) % 7;

  const selectedTasks = tasksOn(selectedDate);
  const selectedOpen = selectedTasks.filter(t => !isTaskDone(t));

  // When the chosen day has nothing open: what's overdue, and what's next.
  const openTasks = tasks.filter(t => !t.archived && !isTaskDone(t));
  const overdue = openTasks.filter(isOverdue).sort((a, b) => compareByUrgency(a, b));
  const upcoming = openTasks
    .filter(t => { const d = taskDay(t); return !!d && startOfDay(d) >= today; })
    .sort((a, b) => (taskDay(a)!.getTime() - taskDay(b)!.getTime()) || compareByUrgency(a, b))
    .slice(0, 3);

  const goToMonth = (month: Date) => setCurrentMonth(startOfMonth(month));
  const goToday = () => { setCurrentMonth(startOfMonth(today)); setSelectedDate(today); };

  const taskRow = (task: Task, showDate = false) => {
    const done = isTaskDone(task);
    const d = taskDay(task);
    return (
      <li key={task.id}
        className={cn("p-3 border border-l-4 rounded-md hover:bg-muted/30 cursor-pointer transition-colors", PRIORITY_STRIPE[task.priority], done && "opacity-60")}
        onClick={() => onTaskClick?.(task)}>
        <p className={cn("font-medium text-sm flex items-start gap-1.5", done && "line-through decoration-muted-foreground/60")}>
          {done && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />}
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className={cn("text-xs", PRIORITY_PILL[task.priority])}>{task.priority}</Badge>
          {showDate && d && (
            <span className={cn("text-xs", isOverdue(task) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground")}>
              {isSameDay(d, today) ? "Today" : format(d, "EEE, MMM d")}
            </span>
          )}
          {!showDate && isOverdue(task) && <span className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue</span>}
        </div>
      </li>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <Link href="/settings/reminders" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                <Bell className="h-3 w-3" /> Get reminders in your phone calendar
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="hide-done" checked={hideDone} onCheckedChange={toggleHideDone} />
                <Label htmlFor="hide-done" className="text-sm text-muted-foreground cursor-pointer">Hide done</Label>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToMonth(addMonths(currentMonth, -1))} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={goToday}>Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToMonth(addMonths(currentMonth, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px rounded-t-md overflow-hidden border-t border-x bg-border text-center text-xs sm:text-sm font-medium">
            {weekDays.map(day => (
              <div key={day} className="py-2 bg-muted text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-b-md overflow-hidden border-x border-b bg-border">
            {Array.from({ length: offset }).map((_, i) => <div key={`lead-${i}`} className="bg-muted/30 min-h-[56px] sm:min-h-[104px]" />)}
            {days.map(day => {
              const dayTasks = tasksOn(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isPast = day < today;
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "bg-card text-left p-1.5 sm:p-2 min-h-[56px] sm:min-h-[104px] flex flex-col gap-1 hover:bg-muted/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isSelected && "ring-2 ring-inset ring-foreground",
                  )}
                >
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold h-6 w-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    !isToday && isPast && "text-muted-foreground",
                  )}>
                    {format(day, "d")}
                  </span>
                  {/* Phones: coloured dots. Larger screens: titles. */}
                  <div className="flex flex-wrap gap-1 sm:hidden">
                    {dayTasks.slice(0, 4).map(t => (
                      <span key={t.id} className={cn("h-1.5 w-1.5 rounded-full", isTaskDone(t) ? "bg-muted-foreground/40" : isOverdue(t) ? "bg-red-500" : DOT[t.priority])} />
                    ))}
                  </div>
                  <div className="hidden sm:flex flex-col gap-0.5 w-full min-w-0">
                    {dayTasks.slice(0, 3).map(t => {
                      const done = isTaskDone(t);
                      return (
                        <span key={t.id} title={t.title}
                          className={cn(
                            "block truncate rounded px-1.5 py-0.5 text-xs border-l-2",
                            PRIORITY_STRIPE[t.priority], PILL_BG[t.priority],
                            isOverdue(t) && "text-red-700 dark:text-red-300 font-medium",
                            done && "bg-muted/60 text-muted-foreground line-through border-l-muted-foreground/30",
                          )}>
                          {t.title}
                        </span>
                      );
                    })}
                    {dayTasks.length > 3 && <span className="text-[11px] text-muted-foreground px-1">+{dayTasks.length - 3} more</span>}
                  </div>
                </button>
              );
            })}
            {Array.from({ length: trailing }).map((_, i) => <div key={`trail-${i}`} className="bg-muted/30 min-h-[56px] sm:min-h-[104px]" />)}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>{isSameDay(selectedDate, today) ? "Today" : format(selectedDate, "EEEE, MMMM d")}</CardTitle>
          <CardDescription>
            {selectedTasks.length === 0
              ? "Nothing due this day."
              : `${selectedOpen.length} open${selectedTasks.length > selectedOpen.length ? `, ${selectedTasks.length - selectedOpen.length} done` : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedTasks.length > 0 && <ul className="space-y-2">{selectedTasks.map(t => taskRow(t))}</ul>}

          {/* Today also carries anything overdue: it still needs doing. */}
          {selectedOpen.length > 0 && isSameDay(selectedDate, today) && overdue.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">Also overdue · {overdue.length}</h4>
              <ul className="space-y-2">{overdue.slice(0, 3).map(t => taskRow(t, true))}</ul>
            </div>
          )}

          {selectedOpen.length === 0 && (
            <>
              {overdue.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">Overdue · {overdue.length}</h4>
                  <ul className="space-y-2">{overdue.slice(0, 3).map(t => taskRow(t, true))}</ul>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Next up</h4>
                {upcoming.length > 0
                  ? <ul className="space-y-2">{upcoming.map(t => taskRow(t, true))}</ul>
                  : <p className="text-sm text-muted-foreground">No upcoming tasks with a due date.</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
