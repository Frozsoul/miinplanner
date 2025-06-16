
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskData, TaskStatus, AIPrioritizedTask, TaskPriority } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { addTask, deleteTask, getTasks, updateTask } from "@/services/task-service";
import { prioritizeTasks as aiPrioritizeTasks, type PrioritizeTasksInput } from "@/ai/flows/prioritize-tasks-flow";
import { parseISO, isValid } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Zap, LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskForm } from "@/components/tasks/TaskForm";


export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrioritizingAI, setIsPrioritizingAI] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchUserTasks = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingTasks(true);
      console.log(`TasksPage: Attempting to fetch tasks for userId: ${user.uid}`);
      try {
        const userTasks = await getTasks(user.uid);
        setTasks(userTasks);
      } catch (error) {
        console.error("TasksPage: Failed to fetch tasks:", error);
        console.error("Full error object during getTasks:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        toast({ title: "Error fetching tasks", description: (error as Error).message || "Could not fetch tasks.", variant: "destructive" });
      } finally {
        setIsLoadingTasks(false);
      }
    } else {
      console.log("TasksPage: fetchUserTasks - No user or user.uid, clearing tasks.");
      setTasks([]); 
      setIsLoadingTasks(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

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
    console.log(`TasksPage: Attempting to save task for userId: ${user.uid}. Editing: ${!!editingTask?.id}`);
    
    try {
      if (editingTask?.id) {
        await updateTask(user.uid, editingTask.id, taskData);
        toast({ title: "Success", description: "Task updated." });
      } else {
        await addTask(user.uid, taskData);
        toast({ title: "Success", description: "Task added." });
      }
      fetchUserTasks();
      closeFormModal();
    } catch (error) {
      console.error("TasksPage: Failed to save task:", error);
      console.error("Full error object during handleSaveTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
    setIsSubmitting(true); // Consider a different loading state for delete if needed
    console.log(`TasksPage: Deleting task ${taskId} for userId: ${user.uid}`);
    try {
      await deleteTask(user.uid, taskId);
      toast({ title: "Success", description: "Task deleted." });
      fetchUserTasks(); 
    } catch (error) {
      console.error("TasksPage: Failed to delete task:", error);
      console.error("Full error object during handleDeleteTask:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast({ title: "Error deleting task", description: (error as Error).message || "Could not delete task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIPrioritizeTasks = async () => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    const tasksToPrioritize = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
    if (tasksToPrioritize.length === 0) {
      toast({ title: "Info", description: "No tasks in 'To Do' or 'In Progress' to prioritize." });
      return;
    }

    setIsPrioritizingAI(true);
    try {
      const aiInput: PrioritizeTasksInput = {
        tasks: tasksToPrioritize.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority as 'Low' | 'Medium' | 'High', // Cast to fit AI flow input
          dueDate: t.dueDate,
          tags: t.tags,
        })),
      };
      const result = await aiPrioritizeTasks(aiInput);
      
      for (const suggestedTask of result.prioritizedTasks) {
        if (suggestedTask.suggestedPriority) {
          const originalTask = tasks.find(t => t.id === suggestedTask.id);
          if (originalTask && originalTask.priority !== suggestedTask.suggestedPriority) {
             await updateTask(user.uid, suggestedTask.id, { priority: suggestedTask.suggestedPriority as TaskPriority });
          }
        }
      }
      fetchUserTasks(); 
      toast({ title: "AI Prioritization Complete", description: "Tasks have been analyzed. Check for updated priorities." });

    } catch (error) {
      console.error("TasksPage: AI prioritization failed:", error);
      console.error("Full error object during AI Prioritization:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast({ title: "AI Error", description: (error as Error).message || "Could not prioritize tasks using AI.", variant: "destructive" });
    } finally {
      setIsPrioritizingAI(false);
    }
  };

  if (isLoadingTasks && tasks.length === 0) { // Show loader only on initial load
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 h-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <LayoutGrid className="h-7 w-7 text-primary"/> Task Manager
        </h1>
        <div className="flex gap-2">
            <Button onClick={handleAIPrioritizeTasks} disabled={isPrioritizingAI || isLoadingTasks} variant="outline">
                {isPrioritizingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 text-accent" />}
                AI Priority Assist
            </Button>
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
