"use client";

import { useState } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import type { Task } from '@/types';
import { format, parseISO, isValid, isToday, isBefore, startOfDay } from 'date-fns';
import { isDoneStatus } from '@/lib/task-colors';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface InlineDatePickerProps {
  task: Task;
}

export function InlineDatePicker({ task }: InlineDatePickerProps) {
  const { updateTaskField, taskStatuses, doneStatus } = useAppData();
  const [isOpen, setIsOpen] = useState(false);

  // Safe date parsing helper
  const parseTaskDate = (date: any) => {
    if (!date) return undefined;
    
    // Handle ISO string
    if (typeof date === 'string') {
      try {
        const parsed = parseISO(date);
        return isValid(parsed) ? parsed : undefined;
      } catch (e) {
        return undefined;
      }
    }
    
    // Handle Firestore Timestamp or Date object
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    if (date instanceof Date && isValid(date)) {
      return date;
    }
    
    return undefined;
  };

  const currentDate = parseTaskDate(task.dueDate);
  const isOpenTask = !task.archived && !isDoneStatus(task.status, taskStatuses, doneStatus);
  const isOverdue = !!currentDate && isOpenTask && isBefore(currentDate, startOfDay(new Date()));
  const isDueToday = !!currentDate && isOpenTask && isToday(currentDate);

  const handleDateSelect = (date: Date | undefined) => {
    updateTaskField(task.id, 'dueDate', date?.toISOString());
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto p-0 justify-start font-normal -ml-1",
            !currentDate && "text-muted-foreground hover:text-foreground",
            isOverdue && "text-red-600 dark:text-red-400 font-medium",
            isDueToday && "text-amber-600 dark:text-amber-400 font-medium"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          {currentDate ? format(currentDate, "MMM dd, yyyy") : "No due date"}
          {isOverdue && <span className="ml-1.5">· Overdue</span>}
          {isDueToday && <span className="ml-1.5">· Today</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        {currentDate && (
          <div className="p-2 border-t text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => handleDateSelect(undefined)}
            >
              Remove due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}