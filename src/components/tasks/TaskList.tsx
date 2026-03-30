
"use client";

import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit3, Trash2, Eye, Archive, ArchiveRestore, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InlinePriorityPicker } from "./inline-priority-picker";
import { InlineStatusPicker } from "./inline-status-picker";
import { InlineDatePicker } from "./inline-date-picker";
import { useAppData } from "@/contexts/app-data-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView?: (task: Task) => void;
  onArchiveToggle: (task: Task) => void;
  hideChannel?: boolean;
}

export function TaskList({ tasks, onEdit, onDelete, onView, onArchiveToggle, hideChannel = false }: TaskListProps) {
  const { workspaceMembers } = useAppData();

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Assignee</TableHead>
            {!hideChannel && <TableHead>Channel</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={hideChannel ? 6 : 7} className="h-24 text-center text-muted-foreground">
                No tasks found. Add a new task to get started!
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const assignedMember = workspaceMembers.find(m => m.uid === task.assignedTo);
              const memberName = assignedMember?.displayName || assignedMember?.email || "Unassigned";
              const memberInitials = memberName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

              return (
                <TableRow key={task.id} className={task.archived ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InlineStatusPicker task={task} />
                      {task.archived && <Badge variant="outline">Archived</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlinePriorityPicker task={task} />
                  </TableCell>
                  <TableCell>
                    <InlineDatePicker task={task} />
                  </TableCell>
                  <TableCell>
                    {task.assignedTo ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-default">
                              <Avatar className="h-6 w-6 border">
                                <AvatarFallback className="text-[10px] bg-primary/5">{memberInitials || <User className="h-3 w-3" />}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[80px] hidden lg:inline">{memberName}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{memberName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  {!hideChannel && <TableCell>{task.channel || "N/A"}</TableCell>}
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
