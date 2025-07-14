
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Task, TaskData, TaskStatus, TaskPriority } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/contexts/app-data-context";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, List, LayoutGrid, ListChecks, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function TasksPage() {
  const { user } = useAuth();
  const { 
    tasks, 
    fetchTasks, 
    addTask: addTaskContext, 
    updateTask: updateTaskContext, 
    deleteTask: deleteTaskContext, 
    isLoadingTasks 
  } = useAppData();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const openFormModal = (taskToEdit?: Task) => {
    setEditingTask(taskToEdit || null);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const openDetailModal = (task: Task) => {
    setViewingTask(task);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setViewingTask(null);
    setIsDetailModalOpen(false);
  };

  const handleSaveTask = async (taskData: TaskData) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (taskData.title.trim() === "") {
      toast({ title: "Validation Error", description: "Title cannot be empty.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask?.id) {
        await updateTaskContext(editingTask.id, taskData);
      } else {
        await addTaskContext(taskData);
      }
      closeFormModal();
    } catch (error) {
      console.error("TasksPage: Failed to save task:", error);
      toast({ title: "Error saving task", description: (error as Error).message || "Could not save task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteTaskContext(taskId);
    } catch (error) {
      console.error("TasksPage: Failed to delete task:", error);
      toast({ title: "Error deleting task", description: (error as Error).message || "Could not delete task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTasks && tasks.length === 0) {
    return (
      <div className="px-4 sm:px-6 md:py-6 flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:py-6 h-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-primary"/> Task Manager
        </h1>
        <div className="flex gap-2">
            <Button onClick={() => openFormModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
            </Button>
        </div>
      </div>

      <Card className="mb-6 shadow-sm border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                 <div className="sm:col-span-1">
                    <Label htmlFor="search-tasks" className="block text-sm font-medium text-muted-foreground mb-1.5">Search</Label>
                    <Input
                        id="search-tasks"
                        placeholder="Keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1.5">Status</Label>
                     <MultiSelect
                        options={TASK_STATUSES.map(s => ({ value: s, label: s }))}
                        selected={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filter by status"
                        className="w-full"
                    />
                </div>
                <div>
                    <Label htmlFor="priority-filter" className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</Label>
                    <MultiSelect
                        options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))}
                        selected={priorityFilter}
                        onChange={setPriorityFilter}
                        placeholder="Filter by priority"
                        className="w-full"
                    />
                </div>
            </div>
            <div className="flex-shrink-0 pt-5">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {if(value) setViewMode(value as 'list' | 'kanban')}} defaultValue="list">
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4"/>
                </ToggleGroupItem>
                <ToggleGroupItem value="kanban" aria-label="Kanban board view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
        </CardContent>
      </Card>

      {isLoadingTasks && tasks.length > 0 && (
        <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Refreshing tasks...</span>
        </div>
      )}

      <div className="flex-grow">
        {viewMode === 'list' ? (
          <TaskList tasks={filteredTasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} />
        ) : (
          <KanbanBoard tasks={filteredTasks} onEditTask={openFormModal} onDeleteTask={handleDeleteTask} onViewTask={openDetailModal} />
        )}

        {!isLoadingTasks && tasks.length > 0 && filteredTasks.length === 0 && (
          <Card className="mt-4">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No tasks found matching your filters.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) closeFormModal(); else setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of your task." : "Fill in the details for your new task."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            <TaskForm
              taskToEdit={editingTask}
              onSave={handleSaveTask}
              onCancel={closeFormModal}
              isSubmitting={isSubmitting}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {viewingTask && (
        <TaskDetailModal
            task={viewingTask}
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
        />
      )}
    </div>
  );
}


interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

function MultiSelect({ options, selected, onChange, className, placeholder = "Select..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className="flex w-full items-center"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Checkbox
                      className="mr-2"
                      checked={selected.includes(option.value)}
                    />
                    {option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
