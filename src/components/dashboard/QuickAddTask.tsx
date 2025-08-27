
"use client";

import { useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import type { TaskData, TaskPriority, TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/tasks/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { TASK_PRIORITIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const initialFormState: Partial<TaskData> & { startDateObj?: Date, dueDateObj?: Date } = {
  title: "",
  description: "",
  priority: "Medium",
  status: "To Do",
  startDateObj: undefined,
  dueDateObj: undefined,
  tags: [],
  channel: "",
};

export function QuickAddTask() {
  const { addTask, taskStatuses } = useAppData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState, status: taskStatuses[0] || 'To Do' });

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ ...initialFormState, status: taskStatuses[0] || 'To Do' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const taskPayload: TaskData = {
      title: formData.title!,
      description: formData.description,
      priority: formData.priority as TaskPriority,
      status: formData.status as TaskStatus,
      startDate: formData.startDateObj?.toISOString(),
      dueDate: formData.dueDateObj?.toISOString(),
      tags: [], // Tags can be added later via full edit
      channel: formData.channel,
    };

    try {
      await addTask(taskPayload);
      toast({ title: "Task Added", description: `"${formData.title}" has been added.` });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("QuickAddTask: Failed to add task", error);
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm();}}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Quick Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add New Task</DialogTitle>
          <DialogDescription>
            Add essential task details. You can add more later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="quick-title">Title</Label>
            <Input
              id="quick-title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div>
            <Label htmlFor="quick-description">Description (Optional)</Label>
            <Textarea
              id="quick-description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => handleChange("priority", value)}
              >
                <SelectTrigger id="quick-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quick-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => handleChange("status", value)}
              >
                <SelectTrigger id="quick-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="quick-startDate">Start Date (Optional)</Label>
                <DatePicker
                date={formData.startDateObj}
                setDate={(date) => handleChange("startDateObj", date)}
                />
            </div>
            <div>
                <Label htmlFor="quick-dueDate">Due Date (Optional)</Label>
                <DatePicker
                date={formData.dueDateObj}
                setDate={(date) => handleChange("dueDateObj", date)}
                />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting || !formData.title?.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
