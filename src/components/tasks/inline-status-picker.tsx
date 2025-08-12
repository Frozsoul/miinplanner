
"use client";

import { useAppData } from '@/contexts/app-data-context';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUSES } from '@/lib/constants';
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

export function InlineStatusPicker({ task }: InlineStatusPickerProps) {
  const { updateTaskField } = useAppData();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus && newStatus !== task.status) {
      updateTaskField(task.id, 'status', newStatus as TaskStatus);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={getStatusBadgeVariant(task.status)}
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
          {TASK_STATUSES.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              {status}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    