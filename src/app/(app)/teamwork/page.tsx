
"use client";

import { useState, useEffect } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarView } from "@/components/calendar/CalendarView";
import { WeekRecapButton } from "@/components/tasks/WeekRecapButton";
import { TaskFilterBar, useTaskFilters, type ViewMode } from "@/components/tasks/TaskFilters";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskCardList } from "@/components/tasks/TaskCardList";
import { TeamMembers } from "@/components/teamwork/TeamMembers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Task, TaskData } from "@/types";

export default function TeamworkPage() {
  const { user } = useAuth();
  const { 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspaceById, 
    workspaceMembers, 
    addWorkspace, 
    inviteToWorkspace, 
    removeFromWorkspace,
    deleteWorkspace,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    isLoadingTasks,
    fetchTasks,
    isTaskDone,
    taskStatuses
  } = useAppData();

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const filters = useTaskFilters(tasks);
  const { filteredTasks, showArchived } = filters;

  // Load workspace-specific tasks when selection changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchTasks(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchTasks]);

  // Filters belong to one board: start clean when switching workspace.
  const { clearFilters, setShowArchived } = filters;
  useEffect(() => {
    clearFilters();
    setShowArchived(false);
    setViewingTask(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    await addWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
    setIsCreatingWorkspace(false);
    setIsNewWorkspaceOpen(false);
  };


  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    setIsDeletingWorkspace(true);
    await deleteWorkspace(currentWorkspace.id);
    setIsDeletingWorkspace(false);
  };

  const openFormModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (data: TaskData) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
      } else {
        await addTask(data, currentWorkspace?.id);
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Couldn't save the task", description: (error as Error).message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async (task: Task) => {
    try {
      await updateTask(task.id, { archived: !task.archived });
      toast({ title: task.archived ? "Task restored" : "Task archived", description: task.title });
    } catch {
      toast({ title: "Couldn't update the task", variant: "destructive" });
    }
  };

  const renderBoard = () => {
    if (viewMode === 'calendar') {
      return <CalendarView tasks={filteredTasks} onTaskClick={setViewingTask} />;
    }
    if (viewMode === 'list') {
      const props = { tasks: filteredTasks, onEdit: openFormModal, onDelete: deleteTask, onView: setViewingTask, onArchiveToggle: handleArchiveToggle, grouped: !showArchived };
      return isMobile ? <TaskCardList {...props} /> : <TaskList {...props} />;
    }
    return (
      <KanbanBoard
        tasks={filteredTasks}
        onEditTask={openFormModal}
        onDeleteTask={deleteTask}
        onViewTask={setViewingTask}
        onArchiveToggle={handleArchiveToggle}
        showArchived={showArchived}
      />
    );
  };

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-4 sm:space-y-6">
      <PageHeader 
        title="Teamwork" 
        description="Collaborate with your team on shared projects and tasks."
        icon={Users}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Workspace picker and members: two compact rows, so phones get to the board quickly. */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Select 
                  value={currentWorkspace?.id || "none"} 
                  onValueChange={(val) => setCurrentWorkspaceById(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={workspaces.length === 0 ? "No workspaces yet" : "Select workspace"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Workspaces</SelectLabel>
                      {workspaces.length > 0 ? (
                        workspaces.map(ws => (
                          <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled className="text-muted-foreground italic">
                          No workspaces yet. Use + to create one.
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {currentWorkspace && currentWorkspace.ownerId === user?.uid && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{currentWorkspace.name}</strong>? This will remove all members and the workspace settings. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWorkspace} className="bg-destructive hover:bg-destructive/90">
                          {isDeletingWorkspace ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Delete Workspace
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Popover open={isNewWorkspaceOpen} onOpenChange={setIsNewWorkspaceOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0" aria-label="New workspace" title="New workspace">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 space-y-2">
                    <p className="text-sm font-medium">New workspace</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Marketing team"
                        value={newWorkspaceName}
                        autoFocus
                        onChange={e => setNewWorkspaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateWorkspace();
                        }}
                      />
                      <Button size="icon" onClick={handleCreateWorkspace} disabled={isCreatingWorkspace || !newWorkspaceName.trim()} aria-label="Create workspace">
                        {isCreatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
            </CardContent>
          </Card>

          {currentWorkspace && (
            <TeamMembers
              workspaceName={currentWorkspace.name}
              members={workspaceMembers}
              currentUid={user?.uid}
              ownerId={currentWorkspace.ownerId}
              isOwner={currentWorkspace.ownerId === user?.uid}
              onInvite={inviteToWorkspace}
              onRemove={removeFromWorkspace}
            />
          )}
        </div>

        {/* Task Area */}
        <div className="lg:col-span-3 space-y-4">
          {!currentWorkspace ? (
            <Card className="h-[400px] flex items-center justify-center border-dashed bg-muted/20">
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Start Collaborating</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Pick a workspace, or create one with the + button, to work on shared tasks with your team.</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold truncate min-w-0">{currentWorkspace.name}</h2>
                <div className="flex gap-2 shrink-0">
                  <WeekRecapButton
                    tasks={tasks}
                    isDone={isTaskDone}
                    boardName={currentWorkspace.name}
                    members={workspaceMembers}
                    className="w-10 px-0 sm:w-auto sm:px-4"
                  />
                  <Button onClick={() => openFormModal()}>
                    <Plus className="mr-1.5 h-4 w-4" /> <span className="sm:hidden">Task</span><span className="hidden sm:inline">New team task</span>
                  </Button>
                </div>
              </div>

              <TaskFilterBar
                filters={filters}
                statuses={taskStatuses}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                members={workspaceMembers}
                currentUid={user?.uid}
              />

              {isLoadingTasks && tasks.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 && !showArchived ? (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="py-12 text-center space-y-3">
                    <p className="font-medium">No team tasks yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Add the first task and assign it to someone. Everyone in {currentWorkspace.name} sees the same board.
                    </p>
                    <Button onClick={() => openFormModal()}>
                      <Plus className="mr-2 h-4 w-4" /> New team task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="min-h-[500px]">
                  {renderBoard()}
                  {filteredTasks.length === 0 && (
                    <Card className="mt-4">
                      <CardContent className="pt-6 text-center text-muted-foreground space-y-3">
                        <p>{showArchived ? "No archived tasks match." : "No tasks match your filters."}</p>
                        {filters.isFiltering && (
                          <Button variant="outline" size="sm" onClick={filters.clearFilters}>Clear filters</Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit team task" : "New team task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of this collaborative task." : "Create a new task for the entire team to see."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            <TaskForm
              taskToEdit={editingTask}
              onSave={handleSaveTask}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {viewingTask && (
        <TaskDetailModal
          task={tasks.find(t => t.id === viewingTask.id) || viewingTask}
          isOpen={!!viewingTask}
          onClose={() => setViewingTask(null)}
          onArchiveToggle={handleArchiveToggle}
        />
      )}
    </div>
  );
}
