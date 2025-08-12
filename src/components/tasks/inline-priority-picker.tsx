
"use client";

import { useAppData } from '@/contexts/app-data-context';
import type { Task, TaskPriority } from '@/types';
import { TASK_PRIORITIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InlinePriorityPickerProps {
  task: Task;
}

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

export function InlinePriorityPicker({ task }: InlinePriorityPickerProps) {
  const { updateTaskField } = useAppData();

  const handlePriorityChange = (newPriority: string) => {
    if (newPriority && newPriority !== task.priority) {
      updateTaskField(task.id, 'priority', newPriority as TaskPriority);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={getPriorityBadgeVariant(task.priority)}
          className="cursor-pointer hover:ring-2 hover:ring-ring"
        >
          {task.priority}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={task.priority}
          onValueChange={handlePriorityChange}
        >
          {TASK_PRIORITIES.map((priority) => (
            <DropdownMenuRadioItem key={priority} value={priority}>
              {priority}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    