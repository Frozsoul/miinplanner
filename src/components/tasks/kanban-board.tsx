
"use client";

import React from 'react';
import type { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { TASK_STATUSES } from "@/lib/constants";
import { DragDropContext, type DropResult } from "react-beautiful-dnd";
import { useAppData } from "@/contexts/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  showArchived: boolean;
}

export function KanbanBoard({ tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle, showArchived }: KanbanBoardProps) {
  const { moveTask } = useAppData();
  const isMobile = useIsMobile();
  
  const columns = showArchived ? ['Archived'] : TASK_STATUSES;

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    moveTask(draggableId, newStatus, destination.index);
  };
  
  const containerClasses = cn(
    "grid gap-6 h-full",
    isMobile 
      ? "grid-flow-col auto-cols-[90%] overflow-x-auto snap-x snap-mandatory p-2" 
      : "lg:grid-cols-5" 
  );


  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={containerClasses}>
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
    </DragDropContext>
  );
}
