
"use client";

import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

interface KanbanColumnProps {
  status: TaskStatus | 'Archived';
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  isArchivedColumn?: boolean;
}

export function KanbanColumn({ status, tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle, isArchivedColumn = false }: KanbanColumnProps) {
  
  const handleArchiveAll = () => {
    // We only archive tasks from the 'Done' column
    if (status === 'Done') {
        tasks.forEach(task => onArchiveToggle(task));
    }
  };

  return (
    <div className="flex flex-col bg-muted/50 rounded-lg h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg flex items-center">
          {status}
          <span className="ml-2 text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>
        </h3>
        {status === 'Done' && !isArchivedColumn && tasks.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleArchiveAll} title="Archive all tasks in this column">
                <Archive className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Archive All</span>
            </Button>
        )}
      </div>
      <ScrollArea className="h-[calc(100vh-26rem)]">
        <div className="p-2 md:p-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onView={onViewTask}
                onArchiveToggle={onArchiveToggle}
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
