"use client";

import { useState } from "react";
import type { Task } from "@/types";
import { TaskCard } from "./task-card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/app-data-context";
import { BUCKET_LABEL, groupByUrgency, type DueBucket } from "@/lib/task-buckets";

interface TaskCardListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  /** Group by Overdue / Today / Next 7 days / Later / No due date with finished tasks collapsed. Off for the archive view. */
  grouped?: boolean;
}

const GROUP_TONE: Record<DueBucket, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  week: "text-foreground",
  later: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function TaskCardList({ tasks, onEdit, onDelete, onView, onArchiveToggle, grouped = true }: TaskCardListProps) {
  const { isTaskDone } = useAppData();
  const [showFinished, setShowFinished] = useState(false);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold">No tasks found</h3>
        <p className="text-sm">Add a new task or adjust your filters.</p>
      </div>
    );
  }

  const card = (task: Task, index: number) => (
    <TaskCard key={task.id} task={task} index={index} onEdit={onEdit} onDelete={onDelete} onView={onView} onArchiveToggle={onArchiveToggle} />
  );

  if (!grouped) return <div className="space-y-4">{tasks.map(card)}</div>;

  const { groups, finished, archived } = groupByUrgency(tasks, isTaskDone);
  const done = [...finished, ...archived];

  return (
    <div className="space-y-6">
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Nothing open. Nice work.</p>}
      {groups.map(g => (
        <section key={g.bucket} className="space-y-3">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wide", GROUP_TONE[g.bucket])}>
            {BUCKET_LABEL[g.bucket]} <span className="font-normal text-muted-foreground">· {g.tasks.length}</span>
          </h3>
          {g.tasks.map(card)}
        </section>
      ))}
      {done.length > 0 && (
        <section className="space-y-3">
          <button type="button" onClick={() => setShowFinished(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
            {showFinished ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Completed · {done.length}
          </button>
          {showFinished && <div className="space-y-3 opacity-75">{done.map(card)}</div>}
        </section>
      )}
    </div>
  );
}
