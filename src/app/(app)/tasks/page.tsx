
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskData } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/contexts/app-data-context";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, LayoutGrid } from "lucide-react";
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
import { parseISO } from 'date-fns';

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

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        toast({ title: "Success", description: "Task updated." });
      } else {
        await addTaskContext(taskData);
        toast({ title: "Success", description: "Task added." });
      }
      // fetchTasks(); // AppDataContext handles fetching after add/update
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
      // fetchTasks(); // AppDataContext handles fetching after delete
      toast({ title: "Success", description: "Task deleted." });
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
          <LayoutGrid className="h-7 w-7 text-primary"/> Task Manager
        </h1>
        <div className="flex gap-2">
            <Button onClick={() => openFormModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
            </Button>
        </div>
      </div>

      {isLoadingTasks && tasks.length > 0 && (
        <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Refreshing tasks...</span>
        </div>
      )}

      <TaskList tasks={tasks} onEdit={openFormModal} onDelete={handleDeleteTask} onView={openDetailModal} />

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) closeFormModal(); else setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of your task." : "Fill in the details for your new task."}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            taskToEdit={editingTask}
            onSave={handleSaveTask}
            onCancel={closeFormModal}
            isSubmitting={isSubmitting}
          />
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
