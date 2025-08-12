
"use client";

import type { Task, TaskPriority } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit3, Trash2, Eye, Calendar, User, Tag, Archive, ArchiveRestore } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
}

const getPriorityBadgeVariant = (priority: TaskPriority) => {
  switch (priority) {
    case 'High': case 'Urgent': return 'destructive';
    case 'Medium': return 'secondary';
    case 'Low': return 'outline';
    default: return 'default';
  }
};

export function TaskCard({ task, index, onEdit, onDelete, onView, onArchiveToggle }: TaskCardProps) {
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

  return (
    <div
        ref={setNodeRef}
        style={style}
    >
        <Card
            {...attributes}
            {...listeners}
            className={cn(
                "bg-card hover:shadow-md transition-shadow duration-200 touch-none", // touch-none is important for dnd-kit
                isDragging && "shadow-lg scale-[1.02] opacity-70 z-50 relative"
            )}
        >
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
                <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
                {task.dueDate && isValid(parseISO(task.dueDate)) && (
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(parseISO(task.dueDate), "MMM dd, yyyy")}</span>
                </div>
                )}
                {task.assignee && (
                <div className="hidden sm:flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{task.assignee}</span>
                </div>
                )}
                {task.tags && task.tags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                    <Tag className="h-3.5 w-3.5" />
                    {task.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
