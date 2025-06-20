
"use client";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
     switch (status) {
      case 'Done': return 'default';
      case 'In Progress': return 'secondary';
      case 'To Do': return 'outline';
      case 'Blocked': return 'destructive';
      case 'Review': return 'default';
      default: return 'default';
    }
  };

  const formatDateSafe = (dateInput: any, dateFormat: string = "PPPpp") => {
    if (!dateInput) return "N/A";
    try {
      // If it's a Firestore Timestamp object
      if (dateInput && typeof dateInput.toDate === 'function') {
        const jsDate = dateInput.toDate();
        if (isValid(jsDate)) {
          return format(jsDate, dateFormat);
        }
      }
      // If it's an ISO string
      if (typeof dateInput === 'string') {
        const parsedDate = parseISO(dateInput);
        if (isValid(parsedDate)) {
          return format(parsedDate, dateFormat);
        }
      }
      // If it's already a Date object
      if (dateInput instanceof Date && isValid(dateInput)) {
         return format(dateInput, dateFormat);
      }
    } catch (e) {
        console.warn("Error formatting date:", dateInput, e);
    }
    return "Invalid Date";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{task.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Created: {formatDateSafe(task.createdAt)} | Last Updated: {formatDateSafe(task.updatedAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          {task.description && (
            <div>
              <h4 className="font-semibold mb-1">Description:</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Status: </span>
              <Badge variant={getStatusBadgeVariant(task.status)} className="capitalize">{task.status}</Badge>
            </div>
            <div>
              <span className="font-semibold">Priority: </span>
              <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize">{task.priority}</Badge>
            </div>
          </div>
          <p><span className="font-semibold">Due Date:</span> {formatDateSafe(task.dueDate, "PPP")}</p>
          <p><span className="font-semibold">Assignee:</span> {task.assignee || "N/A"}</p>
          <p><span className="font-semibold">Channel:</span> {task.channel || "N/A"}</p>
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
