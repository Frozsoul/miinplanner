
"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronsLeftRight, ChevronsRightLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusDotClass } from "@/lib/task-colors";
import { BUCKET_LABEL, dueBucket, finishedRecently, RECENT_DAYS, type DueBucket } from "@/lib/task-buckets";
import { useAppData } from "@/contexts/app-data-context";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanColumnProps {
  status: TaskStatus | 'Archived';
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  isArchivedColumn?: boolean;
  /** Open columns: show Overdue / Today / Next 7 days / Later labels between cards. */
  showGroups?: boolean;
  /** The board's finished status: shows recent work only, and can be collapsed. */
  isFinishedColumn?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const GROUP_TONE: Record<DueBucket, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  week: "text-muted-foreground",
  later: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function KanbanColumn({
  status, tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle,
  isArchivedColumn = false, showGroups = false, isFinishedColumn = false, collapsed = false, onToggleCollapsed,
}: KanbanColumnProps) {
  const [showOlder, setShowOlder] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'COLUMN', status },
    disabled: isArchivedColumn,
  });
  const { taskStatuses, doneStatus } = useAppData();

  // Finished column: recent work first, older work tucked away (never archived or deleted).
  const recent = isFinishedColumn ? tasks.filter(t => finishedRecently(t)) : tasks;
  const older = isFinishedColumn ? tasks.filter(t => !finishedRecently(t)) : [];
  const visible = isFinishedColumn && !showOlder ? recent : tasks;
  const taskIds = visible.map(t => t.id);

  const header = (
    <div className="p-4 border-b flex justify-between items-center gap-2">
      <h3 className="font-semibold text-lg flex items-center min-w-0">
        <span className={cn("mr-2 h-2.5 w-2.5 shrink-0 rounded-full", statusDotClass(status, taskStatuses, doneStatus))} aria-hidden="true" />
        <span className="truncate">{status}</span>
        <span className="ml-2 text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>
      </h3>
      {isFinishedColumn && onToggleCollapsed && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggleCollapsed}
          title={collapsed ? "Show finished tasks" : "Collapse finished tasks"}
          aria-label={collapsed ? "Show finished tasks" : "Collapse finished tasks"}>
          {collapsed ? <ChevronsLeftRight className="h-4 w-4" /> : <ChevronsRightLeft className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );

  if (isFinishedColumn && collapsed) {
    return (
      <div className="flex flex-col bg-muted/30 rounded-lg h-full min-h-[200px] snap-center">
        {header}
        <div
          ref={setNodeRef}
          className={cn("p-4 flex-grow flex flex-col gap-3 transition-colors duration-200", isOver && "bg-accent/20")}
        >
          <div className="rounded-lg bg-card border p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-2xl font-bold leading-none">{recent.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">finished in the last {RECENT_DAYS} days</p>
          </div>
          {recent.length > 0 && (
            <ul className="space-y-1.5">
              {recent.slice(0, 3).map(t => (
                <li key={t.id}>
                  <button type="button" onClick={() => onViewTask(t)}
                    className="text-left text-sm text-muted-foreground line-through decoration-muted-foreground/50 hover:text-foreground line-clamp-1">
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-auto" onClick={onToggleCollapsed}>
            Show all {tasks.length}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Drop a task here to finish it.</p>
        </div>
      </div>
    );
  }

  let lastBucket: DueBucket | null = null;

  return (
    <div className={cn("flex flex-col rounded-lg h-full min-h-[200px] snap-center", isFinishedColumn ? "bg-muted/30" : "bg-muted/50")}>
      {header}
       <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
          <ScrollArea className="flex-grow">
            <div
              ref={setNodeRef}
              className={cn("p-3 space-y-3 h-full transition-colors duration-200", isOver && "bg-accent/20")}
            >
              {visible.length > 0 ? (
                visible.map((task, index) => {
                  const bucket = showGroups ? dueBucket(task) : null;
                  const label = bucket && bucket !== lastBucket ? bucket : null;
                  if (bucket) lastBucket = bucket;
                  return (
                    <div key={task.id} className={cn(isFinishedColumn && "opacity-75")}>
                      {label && (
                        <p className={cn("text-[11px] font-semibold uppercase tracking-wide px-1 pb-1", index > 0 && "pt-2", GROUP_TONE[label])}>
                          {BUCKET_LABEL[label]}
                        </p>
                      )}
                      <TaskCard
                        task={task}
                        index={index}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onView={onViewTask}
                        onArchiveToggle={onArchiveToggle}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed text-sm text-muted-foreground">
                  {isArchivedColumn ? "Nothing archived." : isFinishedColumn ? `Nothing finished in the last ${RECENT_DAYS} days.` : "Drop a task here."}
                </div>
              )}
              {isFinishedColumn && older.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setShowOlder(v => !v)}>
                  {showOlder ? "Hide older" : `Show ${older.length} older`}
                </Button>
              )}
            </div>
          </ScrollArea>
      </SortableContext>
    </div>
  );
}
