
"use client";

import React from 'react';
import type { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { useAppData } from "@/contexts/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DndContext, type DragEndEvent, type CollisionDetection, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, pointerWithin } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from './task-card';
import { compareByUrgency, finishedTime } from '@/lib/task-buckets';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type SortMode = 'smart' | 'added';

// Drop where the pointer is. closestCorners alone compares the corners of the dragged card with
// every target, so a whole column (like the slim finished column) loses to nearby cards in the
// next column. Prefer a card under the pointer, then the column under the pointer, then fall back.
const pointerFirst: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length > 0) {
    const cards = hits.filter(h => args.droppableContainers.find(c => c.id === h.id)?.data.current?.type === 'TASK');
    return cards.length > 0 ? cards : hits;
  }
  return closestCorners(args);
};
const SORT_KEY = 'mp.kanbanSort';
const COLLAPSE_KEY = 'mp.finishedCollapsed';

// Per-viewer preferences. Storage can be blocked (private mode), so every access is guarded.
function readPref(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writePref(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}


interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  showArchived: boolean;
}

export function KanbanBoard({ tasks, onEditTask, onDeleteTask, onViewTask, onArchiveToggle, showArchived }: KanbanBoardProps) {
  const { moveTask, setTasks, taskStatuses, doneStatus } = useAppData();
  const isMobile = useIsMobile();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [sortMode, setSortMode] = React.useState<SortMode>('smart');
  const [finishedCollapsed, setFinishedCollapsed] = React.useState(true);

  React.useEffect(() => {
    if (readPref(SORT_KEY) === 'added') setSortMode('added');
    if (readPref(COLLAPSE_KEY) === 'false') setFinishedCollapsed(false);
  }, []);

  const changeSort = (mode: SortMode) => { setSortMode(mode); writePref(SORT_KEY, mode); };
  const toggleFinished = () => setFinishedCollapsed(prev => { writePref(COLLAPSE_KEY, String(!prev)); return !prev; });
  
  const columns = showArchived ? ['Archived'] : taskStatuses;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
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
        if(activeColumn && overColumn && activeColumn === overColumn && active.id !== over.id){
             setTasks((currentTasks) => {
                const activeIndex = currentTasks.findIndex((t) => t.id === active.id);
                const overIndex = currentTasks.findIndex((t) => t.id === over.id);
                if (activeIndex < 0 || overIndex < 0) return currentTasks;
                return arrayMove(currentTasks, activeIndex, overIndex);
             });
        }
        return;
    }

     const newStatus = overColumn as TaskStatus;
     const overColumnTasks = tasks.filter(t => t.status === newStatus);
     const overIndex = over.data.current?.sortable?.index ?? overColumnTasks.length;

     moveTask(activeId, newStatus, overIndex);
  };
  
  const containerClasses = cn(
    "grid gap-4 h-full",
    isMobile 
      ? "grid-cols-1" 
      : `grid-cols-${columns.length}`
  );

  // Open columns: what needs attention first (or the order tasks were added).
  // Finished column: most recently finished first.
  const tasksFor = (status: string): Task[] => {
    if (showArchived) return tasks.filter(task => task.archived);
    const list = tasks.filter(task => task.status === status);
    if (status === doneStatus) return [...list].sort((a, b) => finishedTime(b) - finishedTime(a));
    if (sortMode === 'smart') {
      const now = new Date();
      return [...list].sort((a, b) => compareByUrgency(a, b, now));
    }
    return list;
  };

  const isCollapsed = (status: string) => !showArchived && status === doneStatus && finishedCollapsed;
  const gridTemplate = columns
    .map(status => (isCollapsed(status) ? 'minmax(190px, 0.5fr)' : 'minmax(0, 1fr)'))
    .join(' ');

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={pointerFirst}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
    >
      {!showArchived && (
        <div className="flex items-center justify-end gap-2 mb-3 text-sm text-muted-foreground">
          <span>Sort</span>
          <ToggleGroup type="single" size="sm" value={sortMode} onValueChange={(v) => { if (v) changeSort(v as SortMode); }}>
            <ToggleGroupItem value="smart" aria-label="Sort by what needs attention first" title="Overdue and due soon first, then by priority">Due first</ToggleGroupItem>
            <ToggleGroupItem value="added" aria-label="Sort by date added" title="The order tasks were added">Date added</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <div className={containerClasses} style={{ gridTemplateColumns: isMobile ? undefined : gridTemplate }}>
        {columns.map(status => {
          const tasksForStatus = tasksFor(status);
          const isFinished = !showArchived && status === doneStatus;
          
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
              showGroups={!showArchived && !isFinished && sortMode === 'smart'}
              isFinishedColumn={isFinished}
              collapsed={isCollapsed(status)}
              onToggleCollapsed={toggleFinished}
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
