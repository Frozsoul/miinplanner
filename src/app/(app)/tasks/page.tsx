
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Task, TaskData, TaskStatus, TaskPriority } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/contexts/app-data-context";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, List, LayoutGrid, ListChecks, ChevronsUpDown, Archive, ArchiveRestore, Library } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_PRIORITIES } from "@/lib/constants";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskCardList } from "@/components/tasks/TaskCardList";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import Link from "next/link";

export default function TasksPage() {
  const { user } = useAuth();
  const { 
    tasks, 
    fetchTasks, 
    addTask: addTaskContext, 
    updateTask: updateTaskContext, 
    deleteTask: deleteTaskContext, 
    isLoadingTasks,
    taskStatuses
  } = useAppData();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tasks]);

  const allChannels = useMemo(() => {
    const channels = new Set<string>();
    tasks.forEach(task => {
      if (task.channel) channels.add(task.channel);
    });
    return Array.from(channels).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by archived state first
      if (task.archived && !showArchived) return false;
      if (!task.archived && showArchived) return false;

      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      const matchesChannel = channelFilter.length === 0 || (task.channel && channelFilter.includes(task.channel));
      const matchesTags = tagFilter.length === 0 || (task.tags && task.tags.some(tag => tagFilter.includes(tag)));
      
      return matchesSearch && matchesStatus && matchesPriority && matchesChannel && matchesTags;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, channelFilter, tagFilter, showArchived]);

  const openFormModal = (taskToEdit?: Task) => {
    setEditingTask(taskToEdit || null);
    setIsFormOpen(true);
    setIsFormDirty(false); // Reset dirty state on open
  };

  const closeFormModal = () => {
    setEditingTask(null);
    setIsFormOpen(false);
    setIsFormDirty(false);
  };

  const handleFormOpenChange = (open: boolean) => {
    if (!open && isFormDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsFormOpen(open);
      if (!open) {
        closeFormModal();
      }
    }
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

  const handleArchiveToggle = async (task: Task) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      await updateTaskContext(task.id, { archived: !task.archived });
      toast({
        title: "Success",
        description: `Task "${task.title}" has been ${!task.archived ? 'archived' : 'restored'}.`,
      });
    } catch (error) {
      console.error("TasksPage: Failed to update archive status:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  };


  if (isLoadingTasks && tasks.length === 0) {
    return (
      <div className="px-4 sm:px-6 md:py-6 flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderContent = () => {
    if (viewMode === 'list') {
      if (isMobile) {
        return <TaskCardList tasks={filteredTasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} onArchiveToggle={handleArchiveToggle} />;
      }
      return <TaskList tasks={filteredTasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} onArchiveToggle={handleArchiveToggle} />;
    }
    return <KanbanBoard tasks={filteredTasks} onEditTask={openFormModal} onDeleteTask={handleDeleteTask} onViewTask={openDetailModal} onArchiveToggle={handleArchiveToggle} showArchived={showArchived}/>;
  };

  return (
    <>
      <div className="px-4 sm:px-6 md:py-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
              <ListChecks className="h-7 w-7 text-primary"/> Task Manager
            </h1>
            <MotivationalQuote context="tasks" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto self-end sm:self-center">
               <Button variant="outline" asChild>
                  <Link href="/settings/workflow">
                      <Library className="mr-2 h-4 w-4" />
                      Manage Spaces
                  </Link>
               </Button>
              <Button onClick={() => openFormModal()} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
              </Button>
          </div>
        </div>

        <Card className="mb-6 shadow-sm border">
          <CardContent className="p-4 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                   <div className="lg:col-span-1">
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
                          title="Status"
                          options={taskStatuses.map(s => ({ value: s, label: s }))}
                          selected={statusFilter}
                          onChange={setStatusFilter}
                      />
                  </div>
                  <div>
                      <Label htmlFor="priority-filter" className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</Label>
                      <MultiSelect
                          title="Priority"
                          options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))}
                          selected={priorityFilter}
                          onChange={setPriorityFilter}
                      />
                  </div>
                  <div>
                      <Label htmlFor="channel-filter" className="block text-sm font-medium text-muted-foreground mb-1.5">Channel</Label>
                      <MultiSelect
                          title="Channel"
                          options={allChannels.map(c => ({ value: c, label: c }))}
                          selected={channelFilter}
                          onChange={setChannelFilter}
                      />
                  </div>
                  <div>
                      <Label htmlFor="tag-filter" className="block text-sm font-medium text-muted-foreground mb-1.5">Tag</Label>
                      <MultiSelect
                          title="Tag"
                          options={allTags.map(t => ({ value: t, label: t }))}
                          selected={tagFilter}
                          onChange={setTagFilter}
                      />
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:justify-between w-full xl:w-auto xl:justify-start pt-5 xl:pt-0">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                  />
                  <Label htmlFor="show-archived" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {showArchived ? <ArchiveRestore className="inline-block h-4 w-4 mr-1" /> : <Archive className="inline-block h-4 w-4 mr-1" />}
                    {showArchived ? 'Viewing Archived' : 'View Archived'}
                  </Label>
                </div>
                <Separator orientation="vertical" className="h-6 hidden sm:block xl:ml-4" />
                <div className="flex-shrink-0">
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {if(value) setViewMode(value as 'list' | 'kanban')}} defaultValue="kanban">
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List className="h-4 w-4"/>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="kanban" aria-label="Kanban board view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
          </CardContent>
        </Card>

        {isLoadingTasks && tasks.length > 0 && (
          <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Refreshing tasks...</span>
          </div>
        )}

        <div className="flex-grow min-h-0">
          {renderContent()}

          {!isLoadingTasks && tasks.length > 0 && filteredTasks.length === 0 && (
            <Card className="mt-4">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No tasks found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
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
                onDirtyChange={setIsFormDirty}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>

         <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes in the task form. Are you sure you want to close it and lose your progress?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                    <AlertDialogAction onClick={closeFormModal}>Discard Changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {viewingTask && (
          <TaskDetailModal
              task={viewingTask}
              isOpen={isDetailModalOpen}
              onClose={closeDetailModal}
              onArchiveToggle={handleArchiveToggle}
          />
        )}
      </div>
    </>
  );
}


interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  title?: string;
}

function MultiSelect({ options, selected, onChange, className, title = "Select" }: MultiSelectProps) {
  
  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const getButtonLabel = () => {
    if (selected.length === 0) return `Filter by ${title.toLowerCase()}`;
    if (selected.length === 1) return selected[0];
    if (selected.length === options.length) return `All ${title}s`;
    return `${selected.length} ${title}s selected`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
          disabled={options.length === 0}
        >
          <span className="truncate">{getButtonLabel()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
            <p className="text-sm font-medium">{title}</p>
        </div>
        <Separator />
        <ScrollArea className="max-h-60">
            <div className="p-1">
            {options.map((option) => (
                <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                <Checkbox
                    id={`multiselect-${title}-${option.value}`}
                    checked={selected.includes(option.value)}
                    readOnly
                />
                <Label htmlFor={`multiselect-${title}-${option.value}`} className="font-normal cursor-pointer flex-1">
                    {option.label}
                </Label>
                </div>
            ))}
            </div>
        </ScrollArea>
        {selected.length > 0 && (
            <>
                <Separator />
                <div className="p-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => onChange([])}
                    >
                        Clear selection
                    </Button>
                </div>
            </>
        )}
      </PopoverContent>
    </Popover>
  );
}
