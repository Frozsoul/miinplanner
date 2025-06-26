"use client";

import type { Task } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { TASK_STATUSES } from "@/lib/constants";

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
}

export function KanbanBoard({ tasks, onEditTask, onDeleteTask, onViewTask }: KanbanBoardProps) {
  return (
    <div className="flex gap-6 pb-4 overflow-x-auto">
      {TASK_STATUSES.map(status => {
        const tasksForStatus = tasks.filter(task => task.status === status);
        return (
          <KanbanColumn 
            key={status}
            status={status}
            tasks={tasksForStatus}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onViewTask={onViewTask}
          />
        );
      })}
    </div>
  );
}
