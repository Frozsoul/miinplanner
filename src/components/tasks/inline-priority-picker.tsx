
"use client";

import { useAppData } from '@/contexts/app-data-context';
import type { Task, TaskPriority } from '@/types';
import { TASK_PRIORITIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { PRIORITY_PILL } from '@/lib/task-colors';
import { cn } from '@/lib/utils';
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
          variant="outline"
          className={cn("cursor-pointer font-medium hover:ring-2 hover:ring-ring", PRIORITY_PILL[task.priority])}
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

    