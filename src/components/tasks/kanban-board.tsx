
"use client";

import type { Task } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { TASK_STATUSES } from "@/lib/constants";

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  showArchived: boolean;
}

export function KanbanBoard({ tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle, showArchived }: KanbanBoardProps) {
  
  const columns = showArchived ? ['Archived'] : TASK_STATUSES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pb-4 md:h-full overflow-y-hidden">
      {columns.map(status => {
        const tasksForStatus = tasks.filter(task => 
          showArchived ? task.archived : task.status === status
        );
        
        return (
          <KanbanColumn 
            key={status}
            status={status}
            tasks={tasksForStatus}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onViewTask={onViewTask}
            onArchiveToggle={onArchiveToggle}
            isArchivedColumn={showArchived}
          />
        );
      })}
    </div>
  );
}
