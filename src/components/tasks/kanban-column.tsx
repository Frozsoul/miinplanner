"use client";

import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, onEditTask, onDeleteTask, onViewTask }: KanbanColumnProps) {
  return (
    <div className="flex flex-col flex-1 min-w-[300px] bg-muted/50 rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center justify-between">
          {status}
          <span className="text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>
        </h3>
      </div>
      <ScrollArea className="h-[calc(100vh-22rem)]">
        <div className="p-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onView={onViewTask}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              No tasks here.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
