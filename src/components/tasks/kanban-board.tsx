
"use client";

import React, { useState } from 'react';
import type { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
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
  const { moveTask, setTasks, taskStatuses } = useAppData();
  const isMobile = useIsMobile();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const columns = showArchived ? ['Archived'] : taskStatuses;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // This is the correct way to conditionally enable/disable the sensor
      // It prevents drag-and-drop on mobile while maintaining hook stability.
      activationConstraint: {
        distance: 8,
      },
      // The `enabled` option is the correct way to conditionally disable a sensor
      enabled: !isMobile
    })
  );


  const findColumn = (id: string | number) => {
    if (typeof id !== 'string') return null;
    if (columns.includes(id as TaskStatus)) return id;
    return tasks.find(t => t.id === id)?.status;
  };

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
  
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id);

    if (!activeColumn || !overColumn || activeColumn === overColumn) {
        // Handle reordering within the same column if you want to persist it
        if(activeColumn && overColumn && activeColumn === overColumn && active.id !== over.id){
             setTasks((currentTasks) => {
                const activeIndex = currentTasks.findIndex((t) => t.id === active.id);
                const overIndex = currentTasks.findIndex((t) => t.id === over.id);
                return arrayMove(currentTasks, activeIndex, overIndex);
             });
        }
        return;
    }

     const newStatus = overColumn as TaskStatus;
     const overColumnTasks = tasks.filter(t => t.status === newStatus);
     const overIndex = over.data.current?.sortable?.index ?? overColumnTasks.length;

     // Call context function to update state and firestore
     moveTask(activeId, newStatus, overIndex);
  };
  
  const containerClasses = cn(
    "grid gap-4 h-full",
    isMobile 
      ? "grid-cols-1" 
      : `grid-cols-${columns.length}`
  );

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
    >
      <div className={containerClasses} style={{ gridTemplateColumns: isMobile ? undefined : `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map(status => {
          const tasksForStatus = tasks.filter(task => 
            showArchived ? task.archived : task.status === status
          );
          
          return (
            <KanbanColumn 
              key={status}
              status={status as TaskStatus}
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
                isOverlay
            />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
