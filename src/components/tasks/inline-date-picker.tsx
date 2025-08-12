
"use client";

import { useState } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import type { Task } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface InlineDatePickerProps {
  task: Task;
}

export function InlineDatePicker({ task }: InlineDatePickerProps) {
  const { updateTaskField } = useAppData();
  const [isOpen, setIsOpen] = useState(false);

  const currentDate = task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined;

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
            !currentDate && "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          {currentDate ? format(currentDate, "MMM dd, yyyy") : "No due date"}
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

    