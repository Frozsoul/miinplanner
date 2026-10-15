
"use client";

import { useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, Trash2, Loader2, GripVertical, CheckCircle2, Circle } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableStatusProps {
    status: string;
    isSubmitting: boolean;
    isFinished: boolean;
    onDelete: (status: string) => void;
    onMarkFinished: (status: string) => void;
}

function SortableStatus({ status, isSubmitting, isFinished, onDelete, onMarkFinished }: SortableStatusProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: status });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center rounded-full touch-none ${isFinished ? "bg-green-100 dark:bg-green-500/15" : "bg-muted"}`}>
            <div {...attributes} {...listeners} className="p-2 cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge variant="secondary" className={`text-sm rounded-none ${isFinished ? "bg-transparent" : ""}`}>{status}</Badge>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
                onClick={() => onMarkFinished(status)}
                disabled={isSubmitting || isFinished}
                title={isFinished ? "Tasks here count as finished" : "Mark as the finished status"}
                aria-label={isFinished ? `${status} is the finished status` : `Mark ${status} as the finished status`}
            >
                {isFinished
                  ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-green-600" />}
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full mr-1"
                onClick={() => onDelete(status)}
                disabled={isSubmitting || isFinished}
                title={isFinished ? "Mark another status as finished before deleting this one" : `Delete ${status}`}
                aria-label={`Delete status ${status}`}
            >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
    );
}

export function StatusManager() {
  const { taskStatuses, addStatus, deleteStatus, reorderStatuses, isLoadingAppData, doneStatus, setDoneStatus } = useAppData();
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleAddStatus = async () => {
    if (!newStatus.trim()) {
      toast({ title: "Error", description: "Status name cannot be empty.", variant: "destructive" });
      return;
    }
    if (taskStatuses.some(s => s.toLowerCase() === newStatus.trim().toLowerCase())) {
        toast({ title: "Error", description: "This status already exists.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    await addStatus(newStatus.trim());
    setNewStatus("");
    setIsSubmitting(false);
  };

  const handleDeleteStatus = async (statusToDelete: string) => {
    setIsSubmitting(true);
    await deleteStatus(statusToDelete);
    setIsSubmitting(false);
  };
  
  const handleMarkFinished = async (status: string) => {
    setIsSubmitting(true);
    await setDoneStatus(status);
    setIsSubmitting(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = taskStatuses.indexOf(active.id as string);
        const newIndex = taskStatuses.indexOf(over.id as string);
        reorderStatuses(oldIndex, newIndex);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListTodo />Task statuses</CardTitle>
        <CardDescription>
          Define your workflow stages. Drag the handle to reorder. The status with the green tick is your finished status:
          tasks there count as done, leave your phone calendar and show in your progress. Click the circle on another status to change it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={taskStatuses} strategy={verticalListSortingStrategy}>
                <div className="flex flex-wrap gap-2">
                    {isLoadingAppData && <Loader2 className="h-5 w-5 animate-spin" />}
                    {!isLoadingAppData && taskStatuses.map(status => (
                        <SortableStatus 
                            key={status} 
                            status={status} 
                            isSubmitting={isSubmitting} 
                            isFinished={status === doneStatus}
                            onDelete={handleDeleteStatus}
                            onMarkFinished={handleMarkFinished}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
        <div className="flex gap-2 pt-2">
          <Input 
            placeholder="Enter new status name..."
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddStatus()}}
          />
          <Button onClick={handleAddStatus} disabled={isSubmitting || !newStatus.trim()}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">Add</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
