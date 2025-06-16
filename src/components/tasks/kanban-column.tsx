
"use client";

import type { Task, TaskStage, AIPrioritizedTask } from "@/types";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Zap, Loader2 } from "lucide-react";

interface KanbanColumnProps {
  stage: TaskStage;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (stage: TaskStage) => void;
  onPrioritizeTasks?: (tasksToPrioritize: Task[]) => Promise<void>; // Optional for "To Do"
  isPrioritizingAI?: boolean; // Optional for "To Do"
}

export function KanbanColumn({ 
  stage, 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onAddTask, 
  onPrioritizeTasks,
  isPrioritizingAI 
}: KanbanColumnProps) {
  
  const handlePrioritize = () => {
    if (onPrioritizeTasks) {
      onPrioritizeTasks(tasks);
    }
  };

  return (
    <div className="flex flex-col w-full md:w-1/4 lg:w-1/5 xl:w-[300px] bg-muted/50 rounded-lg shadow-sm p-1 md:p-2 h-full">
      <div className="flex justify-between items-center p-2 mb-2 sticky top-0 bg-muted/50 z-10">
        <h3 className="font-semibold text-md text-foreground">{stage} ({tasks.length})</h3>
        {stage === "To Do" && onPrioritizeTasks && (
          <Button size="sm" variant="ghost" onClick={handlePrioritize} disabled={isPrioritizingAI || tasks.length === 0} className="text-xs">
            {isPrioritizingAI ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1 text-accent" />}
            AI Priority
          </Button>
        )}
      </div>
      <ScrollArea className="flex-grow h-[calc(100vh-20rem)] pr-2"> {/* Adjust height as needed */}
        <div className="space-y-3 p-1">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              onDelete={onDeleteTask} 
            />
          ))}
        </div>
      </ScrollArea>
      <Button 
        variant="outline" 
        className="mt-3 w-full text-sm py-2" 
        onClick={() => onAddTask(stage)}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Task
      </Button>
    </div>
  );
}
