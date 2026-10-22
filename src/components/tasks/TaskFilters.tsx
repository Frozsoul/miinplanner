"use client";

import { useMemo, useState } from "react";
import type { Task, TaskPriority, TaskStatus, WorkspaceMember } from "@/types";
import { Archive, ArchiveRestore, CalendarDays, ChevronsUpDown, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TASK_PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Search, filters, archived switch and view toggle, shared by the personal board
 * (Task Manager) and team boards (Teamwork). Team boards also get an Assignee filter.
 */

export type ViewMode = "kanban" | "list" | "calendar";

/** Assignee filter value for tasks with nobody assigned. */
export const UNASSIGNED = "__unassigned";

export interface TaskFilterState {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: TaskStatus[];
  setStatusFilter: (v: TaskStatus[]) => void;
  priorityFilter: TaskPriority[];
  setPriorityFilter: (v: TaskPriority[]) => void;
  channelFilter: string[];
  setChannelFilter: (v: string[]) => void;
  tagFilter: string[];
  setTagFilter: (v: string[]) => void;
  assigneeFilter: string[];
  setAssigneeFilter: (v: string[]) => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
  allChannels: string[];
  allTags: string[];
  filteredTasks: Task[];
  /** True when any filter or search is set (archived switch aside). */
  isFiltering: boolean;
  clearFilters: () => void;
}

export function useTaskFilters(tasks: Task[]): TaskFilterState {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => task.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  const allChannels = useMemo(() => {
    const channels = new Set<string>();
    tasks.forEach(task => { if (task.channel) channels.add(task.channel); });
    return Array.from(channels).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tasks.filter(task => {
      if (task.archived !== showArchived) return false;
      const matchesSearch = task.title.toLowerCase().includes(term) ||
        (!!task.description && task.description.toLowerCase().includes(term));
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      const matchesChannel = channelFilter.length === 0 || (!!task.channel && channelFilter.includes(task.channel));
      const matchesTags = tagFilter.length === 0 || (!!task.tags && task.tags.some(tag => tagFilter.includes(tag)));
      const matchesAssignee = assigneeFilter.length === 0 || assigneeFilter.includes(task.assignedTo || UNASSIGNED);
      return matchesSearch && matchesStatus && matchesPriority && matchesChannel && matchesTags && matchesAssignee;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, channelFilter, tagFilter, assigneeFilter, showArchived]);

  const isFiltering = !!searchTerm || statusFilter.length > 0 || priorityFilter.length > 0 ||
    channelFilter.length > 0 || tagFilter.length > 0 || assigneeFilter.length > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setPriorityFilter([]);
    setChannelFilter([]);
    setTagFilter([]);
    setAssigneeFilter([]);
  };

  return {
    searchTerm, setSearchTerm, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter,
    channelFilter, setChannelFilter, tagFilter, setTagFilter, assigneeFilter, setAssigneeFilter,
    showArchived, setShowArchived, allChannels, allTags, filteredTasks, isFiltering, clearFilters,
  };
}

interface TaskFilterBarProps {
  filters: TaskFilterState;
  statuses: TaskStatus[];
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  /** Team boards: members for the Assignee filter. Leave out on the personal board. */
  members?: WorkspaceMember[];
  currentUid?: string;
  className?: string;
}

export function TaskFilterBar({ filters: f, statuses, viewMode, onViewModeChange, members, currentUid, className }: TaskFilterBarProps) {
  const assigneeOptions = useMemo(() => {
    if (!members) return null;
    const me = members.find(m => m.uid === currentUid);
    const others = members.filter(m => m.uid !== currentUid);
    return [
      ...(me ? [{ value: me.uid, label: "Me" }] : []),
      ...others.map(m => ({ value: m.uid, label: m.displayName || m.email.split("@")[0] })),
      { value: UNASSIGNED, label: "Unassigned" },
    ];
  }, [members, currentUid]);

  const field = (id: string, label: string, control: React.ReactNode) => (
    <div>
      <Label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</Label>
      {control}
    </div>
  );

  return (
    <Card className={cn("shadow-sm border", className)}>
      <CardContent className="p-4 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 w-full", assigneeOptions ? "lg:grid-cols-6" : "lg:grid-cols-5")}>
          {field("search-tasks", "Search",
            <Input id="search-tasks" placeholder="Keywords..." value={f.searchTerm} onChange={e => f.setSearchTerm(e.target.value)} />)}
          {assigneeOptions && field("assignee-filter", "Assignee",
            <MultiSelect title="Assignee" options={assigneeOptions} selected={f.assigneeFilter} onChange={f.setAssigneeFilter}
              labelFor={v => assigneeOptions.find(o => o.value === v)?.label || v} />)}
          {field("status-filter", "Status",
            <MultiSelect title="Status" options={statuses.map(s => ({ value: s, label: s }))} selected={f.statusFilter} onChange={f.setStatusFilter} />)}
          {field("priority-filter", "Priority",
            <MultiSelect title="Priority" options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))} selected={f.priorityFilter}
              onChange={v => f.setPriorityFilter(v as TaskPriority[])} />)}
          {field("channel-filter", "Channel",
            <MultiSelect title="Channel" options={f.allChannels.map(c => ({ value: c, label: c }))} selected={f.channelFilter} onChange={f.setChannelFilter} />)}
          {field("tag-filter", "Tag",
            <MultiSelect title="Tag" options={f.allTags.map(t => ({ value: t, label: t }))} selected={f.tagFilter} onChange={f.setTagFilter} />)}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:justify-between w-full xl:w-auto xl:justify-start pt-5 xl:pt-0">
          <div className="flex items-center space-x-2">
            <Switch id="show-archived" checked={f.showArchived} onCheckedChange={f.setShowArchived} />
            <Label htmlFor="show-archived" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {f.showArchived ? <ArchiveRestore className="inline-block h-4 w-4 mr-1" /> : <Archive className="inline-block h-4 w-4 mr-1" />}
              {f.showArchived ? "Viewing archived" : "View archived"}
            </Label>
          </div>
          <Separator orientation="vertical" className="h-6 hidden sm:block xl:ml-4" />
          <div className="flex-shrink-0">
            <ToggleGroup type="single" value={viewMode} onValueChange={v => { if (v) onViewModeChange(v as ViewMode); }}>
              <ToggleGroupItem value="kanban" aria-label="Kanban board view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view"><CalendarDays className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  title?: string;
  /** Button label for a single selected value (defaults to the value itself). */
  labelFor?: (value: string) => string;
}

export function MultiSelect({ options, selected, onChange, className, title = "Select", labelFor }: MultiSelectProps) {
  const handleSelect = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  };

  const getButtonLabel = () => {
    if (selected.length === 0) return `Filter by ${title.toLowerCase()}`;
    if (selected.length === 1) return labelFor ? labelFor(selected[0]) : selected[0];
    if (selected.length === options.length) return `All ${title}s`;
    return `${selected.length} ${title}s selected`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("w-full justify-between", className)} disabled={options.length === 0}>
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
            {options.map(option => (
              <div
                key={option.value}
                role="menuitemcheckbox"
                aria-checked={selected.includes(option.value)}
                tabIndex={0}
                onClick={() => handleSelect(option.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(option.value); } }}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent focus:bg-accent outline-none cursor-pointer"
              >
                {/* The row handles the click; the checkbox and label are display only, so one click toggles once. */}
                <Checkbox checked={selected.includes(option.value)} tabIndex={-1} aria-hidden className="pointer-events-none" />
                <span className="text-sm cursor-pointer flex-1">{option.label}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button size="sm" variant="ghost" className="w-full" onClick={() => onChange([])}>
                Clear selection
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
