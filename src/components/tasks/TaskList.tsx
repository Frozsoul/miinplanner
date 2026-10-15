
"use client";

import { useState, Fragment } from "react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit3, Trash2, Eye, Archive, ArchiveRestore, User, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUCKET_LABEL, groupByUrgency, type DueBucket } from "@/lib/task-buckets";
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
  /** Group open tasks by Overdue / Today / Next 7 days / Later / No due date, finished tasks collapsed. Off for the archive view. */
  grouped?: boolean;
}

const GROUP_TONE: Record<DueBucket, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  week: "text-foreground",
  later: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function TaskList({ tasks, onEdit, onDelete, onView, onArchiveToggle, hideChannel = false, grouped = true }: TaskListProps) {
  const { workspaceMembers, currentWorkspace, isTaskDone } = useAppData();
  const [showFinished, setShowFinished] = useState(false);
  const [showArchivedRows, setShowArchivedRows] = useState(false);

  // Only show columns that carry information on this board.
  const showAssignee = !!currentWorkspace || tasks.some(t => !!t.assignedTo);
  const showChannel = !hideChannel && tasks.some(t => !!t.channel);
  const colCount = 4 + (showAssignee ? 1 : 0) + (showChannel ? 1 : 0) + 1;


  const renderRow = (task: Task) => {
    const assignedMember = workspaceMembers.find(m => m.uid === task.assignedTo);
    const memberName = assignedMember?.displayName || assignedMember?.email || "Unassigned";
    const memberInitials = memberName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
      <TableRow key={task.id} className={cn(task.archived && "bg-muted/30", isTaskDone(task) && "text-muted-foreground")}>
        <TableCell className="font-medium max-w-xs truncate" title={task.title}>
          {onView ? (
            <button type="button" onClick={() => onView(task)} className={cn("hover:underline text-left truncate max-w-full", isTaskDone(task) && "line-through decoration-muted-foreground/50")}>{task.title}</button>
          ) : task.title}
        </TableCell>
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
        {showAssignee && <TableCell>
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
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </TableCell>}
        {showChannel && <TableCell className="text-sm">{task.channel || ""}</TableCell>}
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
  };

  const sectionRow = (key: string, content: React.ReactNode, className?: string) => (
    <TableRow key={key} className="hover:bg-transparent">
      <TableCell colSpan={colCount} className={cn("bg-muted/40 py-2 text-xs font-semibold uppercase tracking-wide", className)}>{content}</TableCell>
    </TableRow>
  );

  const toggleRow = (key: string, open: boolean, label: string, onClick: () => void) => sectionRow(key, (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground uppercase tracking-wide">
      {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      {label}
    </button>
  ));

  const renderGrouped = () => {
    const { groups, finished, archived } = groupByUrgency(tasks, isTaskDone);
    return (
      <>
        {groups.length === 0 && finished.length > 0 && sectionRow("all-clear", "Nothing open. Nice work.", "normal-case tracking-normal text-sm font-medium")}
        {groups.map(g => (
          <Fragment key={g.bucket}>
            {sectionRow(`h-${g.bucket}`, <span className={GROUP_TONE[g.bucket]}>{BUCKET_LABEL[g.bucket]} <span className="font-normal text-muted-foreground">· {g.tasks.length}</span></span>)}
            {g.tasks.map(renderRow)}
          </Fragment>
        ))}
        {finished.length > 0 && (
          <>
            {toggleRow("h-finished", showFinished, `Completed · ${finished.length}`, () => setShowFinished(v => !v))}
            {showFinished && finished.map(renderRow)}
          </>
        )}
        {archived.length > 0 && (
          <>
            {toggleRow("h-archived", showArchivedRows, `Archived · ${archived.length}`, () => setShowArchivedRows(v => !v))}
            {showArchivedRows && archived.map(renderRow)}
          </>
        )}
      </>
    );
  };

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due date</TableHead>
            {showAssignee && <TableHead>Assignee</TableHead>}
            {showChannel && <TableHead>Channel</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                No tasks found. Add a new task to get started!
              </TableCell>
            </TableRow>
          ) : grouped ? (
            renderGrouped()
          ) : (
            tasks.map(renderRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
