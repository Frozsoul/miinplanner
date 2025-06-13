
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskData } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { addTask, deleteTask, getTasks, updateTask } from "@/services/task-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/tasks/date-picker";
import { PlusCircle, Trash2, Edit3, Filter, Loader2, ListChecksIcon as ListChecks } from "lucide-react"; // Renamed ListChecks
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit }: { task: Task; onToggleComplete: (id: string, completed: boolean) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void; }) => {
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</CardTitle>
          <div className="flex items-center space-x-2">
             <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task"><Edit3 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && <p className={`text-sm text-muted-foreground ${task.completed ? "line-through" : ""}`}>{task.description}</p>}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            task.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
            task.priority === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" :
            "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
          }`}>Priority: {task.priority}</span>
          {task.dueDate && isValid(parseISO(task.dueDate)) && <span className="text-muted-foreground">Due: {format(parseISO(task.dueDate), "MMM dd, yyyy")}</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
         <div className="flex items-center space-x-2">
          <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={(checked) => onToggleComplete(task.id, Boolean(checked))} />
          <Label htmlFor={`task-${task.id}`} className="text-sm">Mark as complete</Label>
        </div>
      </CardFooter>
    </Card>
  );
};


export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskFormState, setTaskFormState] = useState<TaskData & { dueDateObj?: Date }>({ title: "", description: "", priority: "Medium", dueDateObj: undefined });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
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

  const handleFormChange = (field: keyof TaskData, value: any) => {
    if (editingTask) {
      setEditingTask(prev => prev ? { ...prev, [field]: value, dueDate: field === 'dueDateObj' ? (value as Date)?.toISOString() : prev.dueDate } : null);
       if (field === 'dueDateObj') {
        setEditingTask(prev => prev ? { ...prev, dueDate: (value as Date)?.toISOString() } : null);
      }
    } else {
      setTaskFormState(prev => ({ ...prev, [field]: value }));
      if (field === 'dueDateObj') {
        setTaskFormState(prev => ({ ...prev, dueDate: (value as Date)?.toISOString() }));
      }
    }
  };
  
  const resetFormState = () => {
    setTaskFormState({ title: "", description: "", priority: "Medium", dueDateObj: undefined });
    setEditingTask(null);
  }

  const handleSaveTask = async () => {
    if (!user?.uid) {
      console.error("TasksPage: handleSaveTask - User not available for saving task.");
      toast({ title: "Error", description: "User not authenticated. Cannot save task.", variant: "destructive" });
      return;
    }
    
    const currentData = editingTask ? {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      dueDate: editingTask.dueDate,
    } : {
      title: taskFormState.title,
      description: taskFormState.description,
      priority: taskFormState.priority,
      dueDate: taskFormState.dueDateObj?.toISOString(),
    };


    if (currentData.title.trim() === "") {
      toast({ title: "Validation Error", description: "Title cannot be empty.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    console.log(`TasksPage: Attempting to save task for userId: ${user.uid}. Editing: ${!!editingTask}`);
    try {
      if (editingTask && editingTask.id) {
        const updatePayload: Partial<TaskData> = {
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority,
            dueDate: editingTask.dueDate, 
        };
        await updateTask(user.uid, editingTask.id, updatePayload);
        toast({ title: "Success", description: "Task updated." });
      } else {
        const newTaskData: TaskData = {
            title: taskFormState.title,
            description: taskFormState.description,
            priority: taskFormState.priority,
            dueDate: taskFormState.dueDateObj?.toISOString(),
            completed: false, 
        };
        await addTask(user.uid, newTaskData);
        toast({ title: "Success", description: "Task added." });
      }
      fetchUserTasks(); 
      setIsFormOpen(false);
      resetFormState();
    } catch (error) {
      console.error("TasksPage: Failed to save task:", error);
      toast({ title: "Error", description: "Could not save task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask({
        ...task,
        dueDate: task.dueDate ? task.dueDate : undefined, 
    });
    setTaskFormState({ 
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        dueDateObj: task.dueDate ? parseISO(task.dueDate) : undefined,
        dueDate: task.dueDate
    });
    setIsFormOpen(true);
  };
  
  const openAddModal = () => {
    resetFormState();
    setIsFormOpen(true);
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    if (!user?.uid) {
      console.error("TasksPage: handleToggleComplete - User not available.");
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    console.log(`TasksPage: Toggling task ${id} to completed: ${completed} for userId: ${user.uid}`);
    try {
      await updateTask(user.uid, id, { completed });
      setTasks(prevTasks => prevTasks.map(task => task.id === id ? { ...task, completed } : task));
      toast({ title: "Status Updated", description: `Task marked as ${completed ? 'complete' : 'incomplete'}.`});
    } catch (error) {
      console.error("TasksPage: Failed to toggle task complete:", error);
      toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user?.uid) {
      console.error("TasksPage: handleDeleteTask - User not available.");
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true); 
    console.log(`TasksPage: Deleting task ${id} for userId: ${user.uid}`);
    try {
      await deleteTask(user.uid, id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      toast({ title: "Success", description: "Task deleted." });
    } catch (error) {
      console.error("TasksPage: Failed to delete task:", error);
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks
    .filter(task => filterPriority === "all" || task.priority === filterPriority)
    .filter(task => showCompleted || !task.completed)
    .sort((a,b) => {
        const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
        if (dateA === Infinity && dateB === Infinity) return 0; 
        return dateA - dateB;
    });


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-bold">Task Manager</h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) resetFormState();}}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="flex items-center gap-2" disabled={!user}>
                <PlusCircle className="h-5 w-5" /> Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" 
                  value={editingTask ? editingTask.title : taskFormState.title} 
                  onChange={e => handleFormChange('title', e.target.value)} 
                  className="col-span-3" placeholder="Task title" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" 
                  value={editingTask ? (editingTask.description || "") : taskFormState.description} 
                  onChange={e => handleFormChange('description', e.target.value)} 
                  className="col-span-3" placeholder="Task description (optional)" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                <Select
                  value={editingTask ? editingTask.priority : taskFormState.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High') => handleFormChange('priority', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <DatePicker 
                  date={editingTask ? (editingTask.dueDate ? parseISO(editingTask.dueDate) : undefined) : taskFormState.dueDateObj} 
                  setDate={(date) => handleFormChange('dueDateObj', date)} 
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={resetFormState}>Cancel</Button></DialogClose>
              <Button onClick={handleSaveTask} disabled={isSubmitting || (editingTask ? !editingTask.title : !taskFormState.title)}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingTask ? "Save Changes" : "Add Task")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="filterPriority" className="font-semibold shrink-0">Filter by Priority:</Label>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 ml-0 md:ml-auto">
            <Checkbox id="showCompleted" checked={showCompleted} onCheckedChange={(checked) => setShowCompleted(Boolean(checked))} />
            <Label htmlFor="showCompleted">Show Completed Tasks</Label>
          </div>
        </div>
      </Card>

      {isLoadingTasks && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoadingTasks && filteredTasks.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">{user ? "No tasks match your filters, or you haven't added any yet." : "Please log in to manage tasks."}</p>
          {user && <p className="text-sm">Click "Add New Task" to get started!</p>}
        </Card>
      )}

      {!isLoadingTasks && filteredTasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} onDelete={handleDeleteTask} onEdit={openEditModal} />
          ))}
        </div>
      )}
    </div>
  );
}

