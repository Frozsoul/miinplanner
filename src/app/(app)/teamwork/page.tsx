"use client";

import { useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Plus, Loader2, Mail, Trash2, LayoutGrid, List, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    tasks,
    addTask,
    updateTask,
    deleteTask,
    isLoadingTasks
  } = useAppData();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    await addWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
    setIsCreatingWorkspace(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    await inviteToWorkspace(inviteEmail.trim());
    setInviteEmail("");
    setIsInviting(false);
  };

  const openFormModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (data: TaskData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader 
        title="Teamwork" 
        description="Collaborate with your team on shared projects and tasks."
        icon={Users}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workspace Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={currentWorkspace?.id} 
                onValueChange={setCurrentWorkspaceById}
                disabled={workspaces.length === 0}
              >
                <SelectTrigger>
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
                        No workspaces found
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <div className="pt-4 border-t space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Create New Workspace</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., Marketing Team" 
                    value={newWorkspaceName} 
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateWorkspace();
                    }}
                  />
                  <Button size="icon" onClick={handleCreateWorkspace} disabled={isCreatingWorkspace || !newWorkspaceName.trim()}>
                    {isCreatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentWorkspace && (
            <Card className="animate-in fade-in slide-in-from-top-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <CardDescription>Members of {currentWorkspace.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {workspaceMembers.map(member => (
                    <div key={member.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{member.displayName || member.email.split('@')[0]}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                      {currentWorkspace.ownerId === user?.uid && member.uid !== user?.uid && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                          onClick={() => removeFromWorkspace(member.uid)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Invite Member</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="User email" 
                      value={inviteEmail} 
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInvite();
                      }}
                    />
                    <Button size="icon" onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                      {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-muted-foreground max-w-sm mx-auto">Create a workspace on the left to start working with your team on shared tasks.</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold truncate max-w-[200px] sm:max-w-none">{currentWorkspace.name} Tasks</h2>
                  <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v as any)}>
                    <ToggleGroupItem value="kanban" aria-label="Kanban View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button onClick={() => openFormModal()} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> New Team Task
                </Button>
              </div>

              {isLoadingTasks ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="min-h-[500px]">
                  {viewMode === 'kanban' ? (
                    <KanbanBoard 
                      tasks={tasks} 
                      onEditTask={openFormModal} 
                      onDeleteTask={deleteTask} 
                      onViewTask={openFormModal} 
                      onArchiveToggle={(t) => updateTask(t.id, { archived: !t.archived })}
                      showArchived={false}
                    />
                  ) : (
                    <TaskList 
                      tasks={tasks} 
                      onEdit={openFormModal} 
                      onDelete={deleteTask} 
                      onView={openFormModal} 
                      onArchiveToggle={(t) => updateTask(t.id, { archived: !t.archived })}
                    />
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
            <DialogTitle>{editingTask ? "Edit Team Task" : "Add Team Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of this collaborative task." : "Create a new task for the entire team to see."}
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            taskToEdit={editingTask} 
            onSave={handleSaveTask} 
            onCancel={() => setIsFormOpen(false)} 
            isSubmitting={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
