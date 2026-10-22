"use client";

import { useMemo, useState } from "react";
import type { Task, TaskPriority, TaskStatus, WorkspaceMember } from "@/types";
import { CalendarDays, LayoutGrid, List, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TASK_PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * One slim toolbar row shared by the personal board (Task Manager) and team boards (Teamwork):
 * search, a single Filter button (all filters and View archived in one panel), a Mine switch on
 * team boards, and the view switch. Filters are a secondary tool, so they stay small; active
 * ones show as removable chips under the row.
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
  /** Team boards: members for the Assignee filter and the Mine switch. Leave out on the personal board. */
  members?: WorkspaceMember[];
  currentUid?: string;
  className?: string;
}

type Option = { value: string; label: string };

export function TaskFilterBar({ filters: f, statuses, viewMode, onViewModeChange, members, currentUid, className }: TaskFilterBarProps) {
  const assigneeOptions = useMemo<Option[] | null>(() => {
    if (!members) return null;
    const me = members.find(m => m.uid === currentUid);
    const others = members.filter(m => m.uid !== currentUid);
    return [
      ...(me ? [{ value: me.uid, label: "Me" }] : []),
      ...others.map(m => ({ value: m.uid, label: m.displayName || m.email.split("@")[0] })),
      { value: UNASSIGNED, label: "Unassigned" },
    ];
  }, [members, currentUid]);

  const isMineOnly = !!currentUid && f.assigneeFilter.length === 1 && f.assigneeFilter[0] === currentUid;
  const activeCount = f.statusFilter.length + f.priorityFilter.length + f.channelFilter.length +
    f.tagFilter.length + f.assigneeFilter.length + (f.showArchived ? 1 : 0);

  // Chips for what's on, so it's clear why the board looks smaller.
  type Chip = { key: string; label: string; remove: () => void };
  const chips: Chip[] = [];
  const addChips = (group: string, values: string[], set: (v: string[]) => void, labelOf: (v: string) => string = v => v) =>
    values.forEach(v => chips.push({ key: `${group}-${v}`, label: `${group}: ${labelOf(v)}`, remove: () => set(values.filter(x => x !== v)) }));
  if (assigneeOptions && !isMineOnly) {
    addChips("Assignee", f.assigneeFilter, f.setAssigneeFilter, v => assigneeOptions.find(o => o.value === v)?.label || v);
  }
  addChips("Status", f.statusFilter, f.setStatusFilter);
  addChips("Priority", f.priorityFilter, v => f.setPriorityFilter(v as TaskPriority[]));
  addChips("Channel", f.channelFilter, f.setChannelFilter);
  addChips("Tag", f.tagFilter, f.setTagFilter);
  if (f.showArchived) chips.push({ key: "archived", label: "Archived tasks", remove: () => f.setShowArchived(false) });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search tasks"
            placeholder="Search"
            value={f.searchTerm}
            onChange={e => f.setSearchTerm(e.target.value)}
            className={cn("h-9 pl-8", f.searchTerm ? "pr-7" : "pr-2")}
          />
          {f.searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => f.setSearchTerm("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 shrink-0 px-2.5 sm:px-3" aria-label="Filter tasks">
              <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Filter</span>
              {activeCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-medium leading-5 text-primary-foreground">{activeCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(92vw,22rem)] p-0">
            <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
              {assigneeOptions && (
                <FilterGroup title="Assignee" options={assigneeOptions} selected={f.assigneeFilter} onChange={f.setAssigneeFilter} />
              )}
              <FilterGroup title="Status" options={statuses.map(s => ({ value: s, label: s }))} selected={f.statusFilter} onChange={f.setStatusFilter} />
              <FilterGroup
                title="Priority"
                options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))}
                selected={f.priorityFilter}
                onChange={v => f.setPriorityFilter(v as TaskPriority[])}
              />
              <FilterGroup title="Channel" options={f.allChannels.map(c => ({ value: c, label: c }))} selected={f.channelFilter} onChange={f.setChannelFilter} empty="No channels on this board yet" />
              <FilterGroup title="Tag" options={f.allTags.map(t => ({ value: t, label: t }))} selected={f.tagFilter} onChange={f.setTagFilter} empty="No tags on this board yet" />
              <div className="flex items-center justify-between border-t pt-3">
                <Label htmlFor="show-archived" className="text-sm font-normal">Show archived tasks</Label>
                <Switch id="show-archived" checked={f.showArchived} onCheckedChange={f.setShowArchived} />
              </div>
            </div>
            {activeCount > 0 && (
              <div className="border-t p-2">
                <Button size="sm" variant="ghost" className="w-full" onClick={() => { f.clearFilters(); f.setShowArchived(false); }}>
                  Clear all
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {assigneeOptions && currentUid && (
          <Button
            variant={isMineOnly ? "default" : "outline"}
            size="sm"
            className="h-9 shrink-0 px-2.5 sm:px-3"
            aria-pressed={isMineOnly}
            title="Only tasks assigned to me"
            onClick={() => f.setAssigneeFilter(isMineOnly ? [] : [currentUid])}
          >
            <UserRound className="h-4 w-4 mr-1" /> Mine
          </Button>
        )}

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={v => { if (v) onViewModeChange(v as ViewMode); }}
          className="ml-auto shrink-0 gap-0.5"
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban board view" className="h-9 w-8 px-0 sm:w-9"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="h-9 w-8 px-0 sm:w-9"><List className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view" className="h-9 w-8 px-0 sm:w-9"><CalendarDays className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={c.remove}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label} <X className="h-3 w-3" />
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              onClick={() => { f.clearFilters(); f.setShowArchived(false); }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline px-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A short tick list for one filter. The whole row is the click target, so one click toggles once. */
function FilterGroup({ title, options, selected, onChange, empty }: {
  title: string;
  options: Option[];
  selected: string[];
  onChange: (v: string[]) => void;
  empty?: string;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty || "Nothing to filter yet"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2">
          {options.map(o => (
            <div
              key={o.value}
              role="menuitemcheckbox"
              aria-checked={selected.includes(o.value)}
              tabIndex={0}
              onClick={() => toggle(o.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(o.value); } }}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <Checkbox checked={selected.includes(o.value)} tabIndex={-1} aria-hidden className="pointer-events-none" />
              <span className="truncate" title={o.label}>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
