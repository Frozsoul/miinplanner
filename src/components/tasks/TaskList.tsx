
"use client";
import type { Task, TaskPriority, TaskStatus } from "@/types"; // Ensured TaskStatus is imported
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit3, Trash2, Eye, Archive, ArchiveRestore } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView?: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onView, onArchiveToggle }: TaskListProps) {
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Urgent': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'default';
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

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No tasks found. Add a new task to get started!
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} className={task.archived ? "bg-muted/30" : ""}>
                <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status)} className="capitalize">{task.status}</Badge>
                    {task.archived && <Badge variant="outline">Archived</Badge>}
                  </div>
                </TableCell>
                <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize">{task.priority}</Badge></TableCell>
                <TableCell>{task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), "MMM dd, yyyy") : "N/A"}</TableCell>
                <TableCell>{task.channel || "N/A"}</TableCell>
                <TableCell>{task.assignee || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && <DropdownMenuItem onClick={() => onView(task)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => onEdit(task)} disabled={task.archived}><Edit3 className="mr-2 h-4 w-4" />Edit Task</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchiveToggle(task)}>
                        {task.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                        {task.archived ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem
                             onSelect={(e) => e.preventDefault()}
                             className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground focus:!bg-destructive focus:!text-destructive-foreground"
                           >
                             <Trash2 className="mr-2 h-4 w-4" />Delete Task
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the task "{task.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
