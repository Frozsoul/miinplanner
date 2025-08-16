
"use client";

import { useAppData } from '@/contexts/app-data-context';
import type { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InlineStatusPickerProps {
  task: Task;
}

const getStatusBadgeVariant = (status: TaskStatus, statuses: TaskStatus[]) => {
  // Simple heuristic for coloring: first/last items are special
  const index = statuses.indexOf(status);
  if (index === statuses.length - 1) return 'default'; // e.g., 'Done'
  if (index === 0) return 'outline'; // e.g., 'To Do'
  return 'secondary'; // In between statuses
};

export function InlineStatusPicker({ task }: InlineStatusPickerProps) {
  const { updateTaskField, taskStatuses } = useAppData();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus && newStatus !== task.status) {
      updateTaskField(task.id, 'status', newStatus as TaskStatus);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={getStatusBadgeVariant(task.status, taskStatuses)}
          className="cursor-pointer hover:ring-2 hover:ring-ring"
        >
          {task.status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={task.status}
          onValueChange={handleStatusChange}
        >
          {taskStatuses.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              {status}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
