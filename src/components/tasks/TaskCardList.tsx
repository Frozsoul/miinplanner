
"use client";
import type { Task } from "@/types";
import { TaskCard } from "./task-card";

interface TaskCardListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
}

export function TaskCardList({ tasks, onEdit, onDelete, onView, onArchiveToggle }: TaskCardListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold">No Tasks Found</h3>
        <p className="text-sm">Add a new task or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onArchiveToggle={onArchiveToggle}
        />
      ))}
    </div>
  );
}
