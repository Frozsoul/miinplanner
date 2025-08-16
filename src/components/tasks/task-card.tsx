
"use client";

import type { Task } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit3, Trash2, Eye, User, Tag, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { InlinePriorityPicker } from "./inline-priority-picker";
import { InlineDatePicker } from "./inline-date-picker";

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  isOverlay?: boolean;
}

export function TaskCard({ task, index, onEdit, onDelete, onView, onArchiveToggle, isOverlay = false }: TaskCardProps) {
    const { 
        attributes, 
        listeners, 
        setNodeRef, 
        transform, 
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'TASK',
            task,
        },
        disabled: task.archived,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    // Use a simpler div structure for the overlay to avoid nested card styles
    const cardContent = (
      <>
        <CardHeader className="p-4">
            <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-semibold leading-tight cursor-pointer hover:underline" onClick={() => onView(task)}>{task.title}</CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)} disabled={task.archived}><Edit3 className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchiveToggle(task)}>
                    {task.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                    {task.archived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action will permanently delete the task "{task.title}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
            <CardDescription className="text-xs pt-1">
                <InlinePriorityPicker task={task} />
            </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
            <InlineDatePicker task={task} />
            {task.assignee && (
            <div className="hidden sm:flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{task.assignee}</span>
            </div>
            )}
            {task.tags && task.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                <Tag className="h-3.5 w-3.5" />
                {task.tags.slice(0, 3).map(tag => <div key={tag} className="px-1.5 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">{tag}</div>)}
            </div>
            )}
        </CardContent>
      </>
    );

  if (isOverlay) {
    return <Card className="shadow-lg scale-[1.02]">{cardContent}</Card>;
  }

  return (
    <div
        ref={setNodeRef}
        style={style}
    >
        <Card
            {...attributes}
            {...listeners}
            className={cn(
                "bg-card hover:shadow-md transition-shadow duration-200 touch-none",
                isDragging && "shadow-lg scale-[1.02] opacity-70 z-50 relative"
            )}
        >
           {cardContent}
        </Card>
    </div>
  );
}
