
"use client";
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, TaskPriority } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ListChecks } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfMonthOffset = getDay(startOfMonth(currentMonth));

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => {
        let match = false;
        if (task.dueDate) {
            try {
                const dueDate = parseISO(task.dueDate);
                if (isSameDay(dueDate, selectedDate)) match = true;
            } catch (e) { console.error("Error parsing task due date:", task.dueDate, e); }
        }
        if (!match && task.startDate) {
             try {
                const startDate = parseISO(task.startDate);
                if (isSameDay(startDate, selectedDate)) match = true;
            } catch (e) { console.error("Error parsing task start date:", task.startDate, e); }
        }
        return match;
    });
  }, [tasks, selectedDate]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    setSelectedDate(startOfMonth(month)); 
  };
  
  const getPriorityBadgeVariant = (priority?: TaskPriority) => {
    if (!priority) return 'default';
    switch (priority) {
      case 'Urgent':
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Calendar
                mode="single"
                selected={currentMonth}
                onMonthChange={handleMonthChange}
                className="p-0 [&_button]:h-8 [&_button]:w-8" // Adjusted size
                classNames={{
                    caption_label: "text-lg font-medium",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    head_row: "hidden", 
                    row: "hidden" 
                }}
                footer={<div className="text-xs text-muted-foreground p-2 text-center">Use arrows to change month.</div>}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px border-t border-x bg-border text-center text-sm font-medium">
            {weekDays.map(day => (
              <div key={day} className="py-2 bg-muted text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 gap-px border-x border-b bg-border">
            {Array.from({ length: firstDayOfMonthOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card aspect-square"></div>
            ))}
            {daysInMonth.map(day => {
              const tasksOnDay = tasks.filter(t => {
                  let match = false;
                  if (t.dueDate) {
                      try { if (isSameDay(parseISO(t.dueDate), day)) match = true; } catch(e){}
                  }
                  if (!match && t.startDate) {
                      try { if (isSameDay(parseISO(t.startDate), day)) match = true; } catch(e){}
                  }
                  return match;
              });
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "p-2 bg-card hover:bg-muted/50 cursor-pointer aspect-square flex flex-col justify-start items-start overflow-hidden",
                    isSelected && "ring-2 ring-primary ring-inset",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50 cursor-default hover:bg-card",
                  )}
                  onClick={() => {
                    if (isSameMonth(day, currentMonth)) {
                      setSelectedDate(day);
                    }
                  }}
                >
                  <span className={cn("font-semibold text-xs sm:text-sm", isToday && !isSelected && "text-accent font-bold", isToday && isSelected && "text-accent-foreground font-bold bg-accent rounded-full px-1.5 py-0.5")}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5 text-xs flex-grow overflow-y-auto w-full no-scrollbar">
                    {tasksOnDay.slice(0,2).map(task => (
                       <div key={task.id} className="p-0.5 rounded bg-primary/10 text-primary truncate text-[10px] sm:text-xs" title={task.title}>
                         <ListChecks className="inline h-3 w-3 mr-0.5 sm:mr-1"/>Task
                       </div>
                    ))}
                    {(tasksOnDay.length > 2) && <div className="text-muted-foreground text-[10px] text-center">...more</div>}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 35 - daysInMonth.length - firstDayOfMonthOffset) }).map((_, i) => (
              <div key={`empty-end-${i}`} className="bg-card aspect-square"></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>Events and tasks for the selected day.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(theme(aspectRatio.square)_*_5_/_var(--tw-cols)_-_theme(spacing.24))] min-h-[400px]"> {/* Adjusted height */}
            {!selectedDate ? (
              <p className="text-muted-foreground">No date selected.</p>
            ) : (
              <>
                {tasksForSelectedDate.length === 0 ? (
                  <p className="text-muted-foreground">No tasks for this day.</p>
                ) : (
                  <div className="space-y-4">
                    {tasksForSelectedDate.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-primary flex items-center gap-2"><ListChecks />Tasks</h4>
                        <ul className="space-y-2">
                          {tasksForSelectedDate.map(task => (
                            <li key={task.id} 
                                className="p-3 border rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                                onClick={() => onTaskClick?.(task)}>
                              <p className="font-medium text-sm">{task.title}</p>
                              <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs mt-1">{task.priority}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
