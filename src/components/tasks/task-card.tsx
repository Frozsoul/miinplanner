
"use client";

import type { Task } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, CalendarDays } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const priorityColor = () => {
    switch (task.priority) {
      case "High":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "Low":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 bg-card flex flex-col h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-md font-semibold leading-tight">{task.title}</CardTitle>
          <div className="flex items-center shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)} aria-label="Edit task">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)} aria-label="Delete task">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm text-muted-foreground flex-grow">
        {task.description && <p className="mb-2 line-clamp-3">{task.description}</p>}
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-3 flex flex-col items-start gap-2 border-t">
        <div className="flex justify-between w-full items-center text-xs">
          <Badge className={`text-xs ${priorityColor()}`}>{task.priority} Priority</Badge>
          {task.dueDate && isValid(parseISO(task.dueDate)) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span>{format(parseISO(task.dueDate), "MMM dd")}</span>
            </div>
          )}
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
