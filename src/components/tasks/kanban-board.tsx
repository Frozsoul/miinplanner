
"use client";

import React, { useState } from 'react';
import type { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { TASK_STATUSES } from "@/lib/constants";
import { useAppData } from "@/contexts/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DndContext, type DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from './task-card';


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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const columns = showArchived ? ['Archived'] : TASK_STATUSES;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px to start dragging
      },
    })
  );

  const onDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if(task) {
        setActiveTask(task);
    }
  };


  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // This is the new status of the task
    const newStatus = over.data.current?.status as TaskStatus;

    // Find the tasks in the destination column to calculate the new index
    const overColumnTasks = tasks.filter(t => t.status === newStatus);

    let newIndex = overColumnTasks.findIndex(t => t.id === overId);
    
    // If we're dropping over a column but not a specific item, findIndex is -1.
    // In that case, we append it to the end.
    if (newIndex === -1) {
        // Check if we are dropping on a column container
        if(over.data.current?.type === 'COLUMN'){
            newIndex = overColumnTasks.length;
        } else {
           return; // Dropped somewhere invalid
        }
    }
    
    // Check if the status is actually changing
    if (activeTask.status !== newStatus) {
        moveTask(activeId, newStatus, newIndex);
    }
    // Note: Reordering within the same column is not implemented in `moveTask` yet
    // For now, only status changes are persisted.
  };
  
  const containerClasses = cn(
    "grid gap-4 h-full",
    isMobile 
      ? "grid-flow-col auto-cols-[90%] overflow-x-auto snap-x snap-mandatory p-2" 
      : "grid-cols-5" 
  );


  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
    >
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
      <DragOverlay>
        {activeTask ? (
            <TaskCard 
                task={activeTask} 
                index={0}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onView={onViewTask}
                onArchiveToggle={onArchiveToggle}
            />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

