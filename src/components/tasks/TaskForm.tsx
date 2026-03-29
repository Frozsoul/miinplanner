"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Task, TaskData, TaskStatus, TaskPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/tasks/date-picker";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
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

const parseTaskDate = (date: any) => {
  if (!date) return undefined;
  if (typeof date === 'string') {
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : undefined;
    } catch (e) {
      return undefined;
    }
  }
  if (date && typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date && isValid(date)) return date;
  return undefined;
};

const getInitialFormState = (taskToEdit: Task | null | undefined, defaultStatus: TaskStatus) => {
    if (!taskToEdit) {
        return {
            title: "",
            description: "",
            priority: "Medium" as TaskPriority,
            status: defaultStatus,
            startDateObj: undefined as Date | undefined,
            dueDateObj: undefined as Date | undefined,
            channel: "",
            tagsString: "",
            assignedTo: "",
        };
    }

    return {
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        startDateObj: parseTaskDate(taskToEdit.startDate),
        dueDateObj: parseTaskDate(taskToEdit.dueDate),
        channel: taskToEdit.channel || "",
        tagsString: (taskToEdit.tags || []).join(", "),
        assignedTo: taskToEdit.assignedTo || "",
    };
};

export function TaskForm({ taskToEdit, onSave, onCancel, isSubmitting, onDirtyChange }: TaskFormProps) {
  const { taskStatuses, workspaceMembers, currentWorkspace } = useAppData();
  const [formData, setFormData] = useState(() => getInitialFormState(taskToEdit, taskStatuses[0] || 'To Do'));

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
      assignedTo: formData.assignedTo || undefined,
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

      {currentWorkspace && (
        <div className="space-y-1.5">
          <Label htmlFor="assignedTo">Assign To</Label>
          <Select value={formData.assignedTo} onValueChange={(v) => handleChange('assignedTo', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {workspaceMembers.map(member => (
                <SelectItem key={member.uid} value={member.uid}>
                  {member.displayName || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <DatePicker date={formData.startDateObj} setDate={(date) => handleChange('startDateObj', date)} />
        </div>
        <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <DatePicker date={formData.dueDateObj} setDate={(date) => handleChange('dueDateObj', date)} />
        </div>
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