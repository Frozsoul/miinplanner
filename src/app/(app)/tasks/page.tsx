
"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types";
import useLocalStorage from "@/hooks/use-local-storage";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/tasks/date-picker";
import { PlusCircle, Trash2, Edit3, Filter } from "lucide-react";
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
import { format, parseISO } from 'date-fns';

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit }: { task: Task; onToggleComplete: (id: string) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void; }) => {
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</CardTitle>
          <div className="flex items-center space-x-2">
             <Button variant="ghost" size="icon" onClick={() => onEdit(task)}><Edit3 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && <p className={`text-sm text-muted-foreground ${task.completed ? "line-through" : ""}`}>{task.description}</p>}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            task.priority === "High" ? "bg-red-100 text-red-700" :
            task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-green-100 text-green-700"
          }`}>Priority: {task.priority}</span>
          {task.dueDate && <span className="text-muted-foreground">Due: {format(parseISO(task.dueDate), "MMM dd, yyyy")}</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
         <div className="flex items-center space-x-2">
          <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => onToggleComplete(task.id)} />
          <Label htmlFor={`task-${task.id}`} className="text-sm">Mark as complete</Label>
        </div>
      </CardFooter>
    </Card>
  );
};


export default function TasksPage() {
  const { user } = useAuth(); // Get the authenticated user
  const tasksStorageKey = user ? `miinplanner_tasks_${user.uid}` : "miinplanner_tasks_guest"; // Create user-specific key, fallback for safety
  
  const [tasks, setTasks] = useLocalStorage<Task[]>(tasksStorageKey, []);
  const [newTask, setNewTask] = useState<{ title: string; description: string; priority: 'Low' | 'Medium' | 'High'; dueDate?: Date }>({ title: "", description: "", priority: "Medium" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState(false);


  const handleAddTask = () => {
    if (newTask.title.trim() === "") return;
    const taskToAdd: Task = { 
      id: Date.now().toString(), 
      ...newTask, 
      dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : undefined,
      completed: false 
    };
    setTasks(prevTasks => [...prevTasks, taskToAdd]);
    setNewTask({ title: "", description: "", priority: "Medium" });
    setIsFormOpen(false);
  };

  const handleEditTask = () => {
    if (!editingTask || editingTask.title.trim() === "") return;
    setTasks(tasks.map(t => t.id === editingTask.id ? {...editingTask, dueDate: editingTask.dueDate ? (typeof editingTask.dueDate === 'string' ? editingTask.dueDate : (editingTask.dueDate as Date).toISOString()) : undefined } : t));
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const openEditModal = (task: Task) => {
    setEditingTask({...task, dueDate: task.dueDate ? parseISO(task.dueDate) : undefined });
    setIsFormOpen(true);
  };
  
  const openAddModal = () => {
    setEditingTask(null);
    setNewTask({ title: "", description: "", priority: "Medium" });
    setIsFormOpen(true);
  }

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks
    .filter(task => filterPriority === "all" || task.priority === filterPriority)
    .filter(task => showCompleted || !task.completed)
    .sort((a,b) => (a.dueDate && b.dueDate) ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : a.dueDate ? -1 : b.dueDate ? 1 : 0);


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-bold">Task Manager</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Add New Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={editingTask ? editingTask.title : newTask.title} onChange={e => editingTask ? setEditingTask({...editingTask, title: e.target.value}) : setNewTask({ ...newTask, title: e.target.value })} className="col-span-3" placeholder="Task title" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" value={editingTask ? editingTask.description : newTask.description} onChange={e => editingTask ? setEditingTask({...editingTask, description: e.target.value}) : setNewTask({ ...newTask, description: e.target.value })} className="col-span-3" placeholder="Task description (optional)" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                <Select
                  value={editingTask ? editingTask.priority : newTask.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High') => editingTask ? setEditingTask({...editingTask, priority: value}) : setNewTask({ ...newTask, priority: value })}
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
                  date={editingTask ? (editingTask.dueDate ? (typeof editingTask.dueDate === 'string' ? parseISO(editingTask.dueDate) : editingTask.dueDate) : undefined) : newTask.dueDate} 
                  setDate={(date) => editingTask ? setEditingTask({...editingTask, dueDate: date?.toISOString()}) : setNewTask({ ...newTask, dueDate: date })} 
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={editingTask ? handleEditTask : handleAddTask}>{editingTask ? "Save Changes" : "Add Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="filterPriority" className="font-semibold">Filter by Priority:</Label>
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

      {filteredTasks.length === 0 && user ? (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">No tasks match your filters, or you haven't added any yet.</p>
          <p className="text-sm">Click "Add New Task" to get started!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} onDelete={handleDeleteTask} onEdit={openEditModal} />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper icon, or import from lucide-react if ListChecks is available there
const ListChecks = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
