
"use client";

import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";
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
}

export function KanbanColumn({ status, tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle, isArchivedColumn = false }: KanbanColumnProps) {
  
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'COLUMN',
      status: status
    },
    disabled: isArchivedColumn,
  });

  const taskIds = tasks.map(t => t.id);

  return (
    <div className="flex flex-col bg-muted/50 rounded-lg h-full min-h-[200px] snap-center">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg flex items-center">
          {status}
          <span className="ml-2 text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>
        </h3>
      </div>
       <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
          <ScrollArea 
            className="flex-grow"
          >
            <div 
              ref={setNodeRef}
              className={cn(
                "p-3 space-y-3 h-full transition-colors duration-200",
                isOver && "bg-accent/20"
              )}
            >
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    index={index}
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
      </SortableContext>
    </div>
  );
}
