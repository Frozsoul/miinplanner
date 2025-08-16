
"use client";

import { useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableStatusProps {
    status: string;
    isSubmitting: boolean;
    onDelete: (status: string) => void;
}

function SortableStatus({ status, isSubmitting, onDelete }: SortableStatusProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: status });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center bg-muted rounded-full touch-none">
            <div {...attributes} {...listeners} className="p-2 cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge variant="secondary" className="text-sm rounded-none">{status}</Badge>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
                onClick={() => onDelete(status)}
                disabled={isSubmitting}
                aria-label={`Delete status ${status}`}
            >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
    );
}

export function StatusManager() {
  const { taskStatuses, addStatus, deleteStatus, reorderStatuses, isLoadingAppData } = useAppData();
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
        <CardTitle className="flex items-center gap-2"><ListTodo />Custom Task Statuses</CardTitle>
        <CardDescription>
          Define your workflow stages. Drag the handle to reorder, and the Kanban board will update accordingly.
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
                            onDelete={handleDeleteStatus}
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
