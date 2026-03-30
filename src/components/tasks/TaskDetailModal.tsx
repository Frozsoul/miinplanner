"use client";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, User } from "lucide-react";
import { useAppData } from "@/contexts/app-data-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onArchiveToggle: (task: Task) => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onArchiveToggle }: TaskDetailModalProps) {
  const { workspaceMembers } = useAppData();
  
  if (!task) return null;

  const assignedMember = workspaceMembers.find(m => m.uid === task.assignedTo);
  const memberName = assignedMember?.displayName || assignedMember?.email || "Unassigned";
  const memberInitials = memberName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const isTeamTask = !!task.workspaceId;

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
      case 'Pending': return 'secondary';
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
          <div className="flex items-center gap-4">
             <DialogTitle className="text-2xl font-semibold">{task.title}</DialogTitle>
             {task.archived && <Badge variant="outline">Archived</Badge>}
          </div>
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
              <h4 className="font-semibold mb-1">Status:</h4>
              <Badge variant={getStatusBadgeVariant(task.status)} className="capitalize">{task.status}</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Priority:</h4>
              <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize">{task.priority}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Assigned To:</h4>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarFallback className="text-[10px] bg-primary/5">{memberInitials || <User className="h-3 w-3" />}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{memberName}</span>
              </div>
            </div>
            {!isTeamTask && (
              <div>
                <h4 className="font-semibold mb-1">Channel:</h4>
                <span className="text-muted-foreground">{task.channel || "N/A"}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Start Date:</h4>
              <span className="text-muted-foreground">{formatDateSafe(task.startDate, "PPP")}</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Due Date:</h4>
              <span className="text-muted-foreground">{formatDateSafe(task.dueDate, "PPP")}</span>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                onArchiveToggle(task);
                onClose();
              }}
            >
              {task.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
              {task.archived ? 'Restore Task' : 'Archive Task'}
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
