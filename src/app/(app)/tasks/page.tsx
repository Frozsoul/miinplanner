
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskData, TaskStage, AIPrioritizedTask } from "@/types";
import { TASK_STAGES } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { addTask, deleteTask, getTasks, updateTask } from "@/services/task-service";
import { prioritizeTasks as aiPrioritizeTasks, type PrioritizeTasksInput } from "@/ai/flows/prioritize-tasks-flow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/tasks/date-picker";
import { KanbanColumn } from "@/components/tasks/kanban-column";
import { Loader2, LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrioritizingAI, setIsPrioritizingAI] = useState(false);

  const initialFormState: TaskData & { dueDateObj?: Date; tagsString?: string } = { 
    title: "", 
    description: "", 
    priority: "Medium", 
    stage: "To Do", 
    dueDateObj: undefined, 
    tagsString: "" 
  };
  const [taskFormState, setTaskFormState] = useState(initialFormState);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchUserTasks = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingTasks(true);
      console.log(`TasksPage: Attempting to fetch tasks for userId: ${user.uid}`);
      try {
        const userTasks = await getTasks(user.uid);
        setTasks(userTasks);
      } catch (error) {
        console.error("TasksPage: Failed to fetch tasks:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
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

  const handleFormInputChange = (field: keyof typeof taskFormState, value: any) => {
    setTaskFormState(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setTaskFormState(initialFormState);
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const openFormModal = (stage?: TaskStage, taskToEdit?: Task) => {
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setTaskFormState({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority,
        stage: taskToEdit.stage,
        dueDateObj: taskToEdit.dueDate ? parseISO(taskToEdit.dueDate) : undefined,
        tagsString: (taskToEdit.tags || []).join(", "),
      });
    } else {
      setEditingTask(null);
      setTaskFormState({ ...initialFormState, stage: stage || "To Do" });
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = async () => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (taskFormState.title.trim() === "") {
      toast({ title: "Validation Error", description: "Title cannot be empty.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    const tagsArray = taskFormState.tagsString?.split(',').map(tag => tag.trim()).filter(tag => tag) || [];
    
    const taskPayload: TaskData = {
      title: taskFormState.title,
      description: taskFormState.description,
      priority: taskFormState.priority,
      stage: taskFormState.stage,
      dueDate: taskFormState.dueDateObj?.toISOString(),
      tags: tagsArray,
      completed: taskFormState.stage === "Done", // Mark completed if in "Done" stage
    };

    try {
      if (editingTask?.id) {
        console.log(`TasksPage: Attempting to update task ${editingTask.id} for userId: ${user.uid}`);
        await updateTask(user.uid, editingTask.id, taskPayload);
        toast({ title: "Success", description: "Task updated." });
      } else {
        console.log(`TasksPage: Attempting to add task for userId: ${user.uid}`);
        await addTask(user.uid, taskPayload);
        toast({ title: "Success", description: "Task added." });
      }
      fetchUserTasks();
      resetForm();
    } catch (error) {
      console.error("TasksPage: Failed to save task:", error);
      toast({ title: "Error", description: "Could not save task.", variant: "destructive" });
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
    console.log(`TasksPage: Deleting task ${taskId} for userId: ${user.uid}`);
    try {
      await deleteTask(user.uid, taskId);
      toast({ title: "Success", description: "Task deleted." });
      fetchUserTasks(); // Re-fetch to update list
    } catch (error) {
      console.error("TasksPage: Failed to delete task:", error);
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIPrioritizeTasks = async (tasksToPrioritize: Task[]) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (tasksToPrioritize.length === 0) {
      toast({ title: "Info", description: "No tasks to prioritize in this column." });
      return;
    }

    setIsPrioritizingAI(true);
    try {
      const aiInput: PrioritizeTasksInput = {
        tasks: tasksToPrioritize.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate,
          tags: t.tags,
        })),
      };
      const result = await aiPrioritizeTasks(aiInput);
      
      // Update tasks based on AI suggestions
      const updatedTasks = tasks.map(originalTask => {
        const aiSuggestion = result.prioritizedTasks.find(pt => pt.id === originalTask.id);
        if (aiSuggestion && aiSuggestion.suggestedPriority) {
          return { ...originalTask, priority: aiSuggestion.suggestedPriority };
        }
        return originalTask;
      });
      
      // Persist changes for multiple tasks (batched write or individual updates)
      // For simplicity, individual updates here. Could be optimized with batched writes.
      for (const task of result.prioritizedTasks) {
        if (task.suggestedPriority) {
          const originalTaskData = tasks.find(t => t.id === task.id);
          if (originalTaskData && originalTaskData.priority !== task.suggestedPriority) {
             await updateTask(user.uid, task.id, { priority: task.suggestedPriority });
          }
        }
      }
      fetchUserTasks(); // Re-fetch to show updated priorities
      toast({ title: "AI Prioritization", description: "Tasks have been analyzed by AI. Check for updated priorities." });

    } catch (error) {
      console.error("TasksPage: AI prioritization failed:", error);
      toast({ title: "AI Error", description: "Could not prioritize tasks using AI.", variant: "destructive" });
    } finally {
      setIsPrioritizingAI(false);
    }
  };


  if (isLoadingTasks) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <LayoutGrid className="h-7 w-7 text-primary"/> Task Board
        </h1>
      </div>
      
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-w-max">
          {TASK_STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              tasks={tasks.filter(task => task.stage === stage)}
              onEditTask={(task) => openFormModal(undefined, task)}
              onDeleteTask={handleDeleteTask}
              onAddTask={openFormModal}
              onPrioritizeTasks={stage === "To Do" ? handleAIPrioritizeTasks : undefined}
              isPrioritizingAI={isPrioritizingAI && stage === "To Do"}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); else setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of your task." : "Fill in the details for your new task."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={taskFormState.title} onChange={e => handleFormInputChange('title', e.target.value)} placeholder="Task title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={taskFormState.description} onChange={e => handleFormInputChange('description', e.target.value)} placeholder="Task description (optional)" />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select value={taskFormState.priority} onValueChange={(value: 'Low' | 'Medium' | 'High') => handleFormInputChange('priority', value)}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stage">Stage</Label>
                <Select value={taskFormState.stage} onValueChange={(value: TaskStage) => handleFormInputChange('stage', value)}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {TASK_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <DatePicker date={taskFormState.dueDateObj} setDate={(date) => handleFormInputChange('dueDateObj', date)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={taskFormState.tagsString} onChange={e => handleFormInputChange('tagsString', e.target.value)} placeholder="e.g., SEO, social, urgent" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={resetForm}>Cancel</Button></DialogClose>
            <Button onClick={handleSaveTask} disabled={isSubmitting || !taskFormState.title}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingTask ? "Save Changes" : "Add Task")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
