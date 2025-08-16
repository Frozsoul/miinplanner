
"use client";

import { useState, useEffect, useRef } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { List, Save, Upload, Download, Trash2, Play, Loader2, ListChecks } from "lucide-react";
import type { TaskSpace } from "@/types";
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

export function TaskSpacesManager() {
  const { 
    tasks,
    taskSpaces, 
    fetchTaskSpaces, 
    saveCurrentTaskSpace, 
    loadTaskSpace, 
    deleteTaskSpace,
    importTaskSpace
  } = useAppData();
  const { toast } = useToast();
  const [newSpaceName, setNewSpaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTaskSpaces();
  // eslint-disable-next-line react-hooks-exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!newSpaceName.trim()) {
      toast({ title: "Error", description: "Task space name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    await saveCurrentTaskSpace(newSpaceName);
    setNewSpaceName("");
    setIsLoading(false);
  };

  const handleLoad = async (space: TaskSpace) => {
    setIsLoading(true);
    await loadTaskSpace(space.id);
    setIsLoading(false);
  };

  const handleDelete = async (space: TaskSpace) => {
    setIsLoading(true);
    await deleteTaskSpace(space.id);
    setIsLoading(false);
  };

  const handleExport = () => {
    if (tasks.length === 0) {
      toast({ title: "No tasks to export", description: "Add some tasks before exporting.", variant: "destructive" });
      return;
    }
    const space: Omit<TaskSpace, 'id'> = {
      name: `MiinPlanner Export ${new Date().toLocaleDateString()}`,
      createdAt: new Date(),
      tasks: tasks.map(({ id, createdAt, updatedAt, userId, ...taskData }) => taskData)
    };
    const dataStr = JSON.stringify(space, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'miinplanner-task-space.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read");
        const importedSpace = JSON.parse(text);
        
        // Basic validation
        if (!importedSpace.name || !Array.isArray(importedSpace.tasks)) {
             throw new Error("Invalid task space file format.");
        }

        setIsLoading(true);
        await importTaskSpace(importedSpace as TaskSpace);
        toast({ title: "Success", description: "Task space imported successfully." });
      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "Import Error", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoading(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListChecks />Task Spaces</CardTitle>
        <CardDescription>
          Save, load, or share your entire set of tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold text-sm mb-2">Saved Spaces</h4>
          {taskSpaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved spaces yet. Save your current tasks to create one.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {taskSpaces.map(space => (
                <div key={space.id} className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm font-medium">{space.name}</span>
                  <div className="flex gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}><Play className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Load Task Space?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will replace all of your current tasks with the tasks from &quot;{space.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleLoad(space)}>Load Space</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={isLoading}><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                       <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task Space?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{space.name}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(space)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
           <h4 className="font-semibold text-sm mb-2">Save Current Tasks</h4>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter new space name..."
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleSave} disabled={isLoading || !newSpaceName.trim() || tasks.length === 0}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Save</span>
            </Button>
          </div>
        </div>
         <div className="space-y-2">
           <h4 className="font-semibold text-sm mb-2">Import / Export</h4>
           <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="h-4 w-4 mr-2" /> Import from File
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={tasks.length === 0} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Export to File
              </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
