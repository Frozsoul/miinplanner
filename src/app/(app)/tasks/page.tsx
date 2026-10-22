
"use client";

import { useState, useEffect } from "react";
import type { Task, TaskData } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/contexts/app-data-context";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ListChecks, Library, Bell, Sparkles } from "lucide-react";
import { RemindersBanner } from "@/components/tasks/RemindersBanner";
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
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { UpNext, EmptyBoardWelcome } from "@/components/tasks/UpNext";
import { CompanionBox } from "@/components/companion/CompanionBox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskCardList } from "@/components/tasks/TaskCardList";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { CalendarView } from "@/components/calendar/CalendarView";
import { WeekRecapButton } from "@/components/tasks/WeekRecapButton";
import { TaskFilterBar, useTaskFilters, type ViewMode } from "@/components/tasks/TaskFilters";
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
    taskStatuses,
    setCurrentWorkspaceById,
    isTaskDone
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

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const filters = useTaskFilters(tasks);
  const { filteredTasks, showArchived } = filters;

  useEffect(() => {
    // Clear workspace context to ensure personal statuses are used
    setCurrentWorkspaceById("");
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
    if (viewMode === 'calendar') {
      return <CalendarView tasks={filteredTasks} onTaskClick={openDetailModal} />;
    }
    if (viewMode === 'list') {
      if (isMobile) {
        return <TaskCardList tasks={filteredTasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} onArchiveToggle={handleArchiveToggle} grouped={!showArchived} />;
      }
      return <TaskList tasks={filteredTasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} onArchiveToggle={handleArchiveToggle} grouped={!showArchived} />;
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
          <div className="flex flex-wrap gap-2 w-full sm:w-auto self-end sm:self-center">
               <Button variant="outline" asChild>
                  <Link href="/settings/workflow">
                      <Library className="mr-2 h-4 w-4" />
                      Manage Spaces
                  </Link>
               </Button>
               <Button variant="outline" asChild>
                  <Link href="/settings/reminders">
                      <Bell className="mr-2 h-4 w-4" />
                      Reminders
                  </Link>
               </Button>
               <WeekRecapButton tasks={tasks} isDone={isTaskDone} boardName="My board" />
               <Button variant="outline" asChild>
                  <Link href="/planner">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Plan with AI
                  </Link>
               </Button>
              <Button onClick={() => openFormModal()} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
              </Button>
          </div>
        </div>

        <RemindersBanner />

        <TaskFilterBar
          className="mb-6"
          filters={filters}
          statuses={taskStatuses}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {isLoadingTasks && tasks.length > 0 && (
          <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Refreshing tasks...</span>
          </div>
        )}

        {!showArchived && tasks.length > 0 && (
          <div className="mb-6 flex flex-col lg:flex-row gap-4 items-stretch">
            <UpNext tasks={tasks} onView={openDetailModal} className="mb-0 flex-1 min-w-0" />
            <CompanionBox className="lg:w-80 shrink-0" />
          </div>
        )}

        <div className="flex-grow min-h-0">
          {!isLoadingTasks && tasks.length === 0 && !showArchived
            ? <EmptyBoardWelcome onAddTask={() => openFormModal()} />
            : renderContent()}

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


