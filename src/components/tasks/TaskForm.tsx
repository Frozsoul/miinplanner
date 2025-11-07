
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Task, TaskData, TaskStatus, TaskPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentsui/select";
import { DatePicker } from "@/components/tasks/date-picker";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { parseISO, isValid } from "date-fns";
import { TASK_PRIORITIES } from "@/lib/constants";
import { useAppData } from "@/contexts/app-data-context";
import isEqual from 'lodash.isequal';


interface TaskFormProps {
  taskToEdit?: Task | null;
  onSave: (taskData: TaskData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

const getInitialFormState = (taskToEdit: Task | null | undefined, defaultStatus: TaskStatus): TaskData & { startDateObj?: Date; dueDateObj?: Date; tagsString?: string } => {
    if (!taskToEdit) {
        return {
            title: "",
            description: "",
            priority: "Medium",
            status: defaultStatus,
            startDateObj: undefined,
            dueDateObj: undefined,
            channel: "",
            tagsString: "",
            tags: [],
        };
    }

    let startDateObject: Date | undefined = undefined;
    if (taskToEdit.startDate) {
        try {
            const parsed = parseISO(taskToEdit.startDate);
            if (isValid(parsed)) startDateObject = parsed;
        } catch (e) {}
    }

    let dueDateObject: Date | undefined = undefined;
    if (taskToEdit.dueDate) {
        try {
            const parsed = parseISO(taskToEdit.dueDate);
            if (isValid(parsed)) dueDateObject = parsed;
        } catch (e) {}
    }

    return {
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        startDateObj: startDateObject,
        dueDateObj: dueDateObject,
        channel: taskToEdit.channel || "",
        tagsString: (taskToEdit.tags || []).join(", "),
        tags: taskToEdit.tags || [],
    };
};


export function TaskForm({ taskToEdit, onSave, onCancel, isSubmitting, onDirtyChange }: TaskFormProps) {
  const { taskStatuses } = useAppData();
  const [initialState, setInitialState] = useState(() => getInitialFormState(taskToEdit, taskStatuses[0] || 'To Do'));
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    const newInitialState = getInitialFormState(taskToEdit, taskStatuses[0] || 'To Do');
    setInitialState(newInitialState);
    setFormData(newInitialState);
    onDirtyChange?.(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskToEdit, taskStatuses]);
  
  useEffect(() => {
    const isDirty = !isEqual(initialState, formData);
    onDirtyChange?.(isDirty);
  }, [formData, initialState, onDirtyChange]);


  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const taskPayload: TaskData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      startDate: formData.startDateObj?.toISOString(),
      dueDate: formData.dueDateObj?.toISOString(),
      channel: formData.channel,
      tags: formData.tagsString?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
    };
    onSave(taskPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="Task title" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Task description (optional)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: TaskStatus) => handleChange('status', value)}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {taskStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value: TaskPriority) => handleChange('priority', value)}>
            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
       <div className="space-y-1.5">
        <Label htmlFor="channel">Channel</Label>
        <Input id="channel" value={formData.channel} onChange={e => handleChange('channel', e.target.value)} placeholder="e.g., Blog, Social Media" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <Label htmlFor="startDate">Start Date (Optional)</Label>
            <DatePicker date={formData.startDateObj} setDate={(date) => handleChange('startDateObj', date)} />
        </div>
        <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <DatePicker date={formData.dueDateObj} setDate={(date) => handleChange('dueDateObj', date)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={formData.tagsString} onChange={e => handleChange('tagsString', e.target.value)} placeholder="e.g., SEO, urgent, marketing" />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !formData.title}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (taskToEdit ? "Save Changes" : "Add Task")}
        </Button>
      </div>
    </form>
  );
}
