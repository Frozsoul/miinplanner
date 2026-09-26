
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppData } from "@/contexts/app-data-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Download, Loader2, ListChecks, Library, ArrowRight, Sparkles } from "lucide-react";
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
import { taskSpaceTemplates, templateToTasks, type MarketingTemplate } from "@/lib/task-space-templates";
import { useToast } from "@/hooks/use-toast";

export function TaskSpacesSection() {
  const { 
    tasks,
    taskSpaces, 
    fetchTaskSpaces, 
    loadTaskSpace, 
    addTasks,
    taskStatuses,
  } = useAppData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const featuredTemplates = taskSpaceTemplates.slice(0, 3);

  useEffect(() => {
    fetchTaskSpaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleLoadSpace = async (space: TaskSpace) => {
    setIsLoading(true);
    await loadTaskSpace(space.id);
    setIsLoading(false);
  };

  const handleAddTemplate = async (template: MarketingTemplate) => {
    setIsLoading(true);
    try {
      const count = await addTasks(templateToTasks(template, new Date(), taskStatuses[0] || "To Do"));
      toast({ title: `${count} tasks added`, description: `"${template.name}" was added to your board with due dates from today.` });
    } catch (err) {
      console.error("Adding template failed:", err);
      toast({ title: "Couldn't add the template", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/>Your Saved Spaces</CardTitle>
          <CardDescription>Quickly load a saved set of tasks and statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {taskSpaces.length > 0 ? (
            <div className="space-y-2">
              {taskSpaces.slice(0, 2).map(space => (
                <div key={space.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{space.name}</p>
                    <p className="text-xs text-muted-foreground">Saved on: {new Date(space.createdAt as Date).toLocaleDateString()}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="ml-2">Load</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Load this saved space?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This replaces the tasks and statuses on your personal board with the ones from &quot;{space.name}&quot;. Your current board is saved to Saved Spaces first, so you can switch back. Workspace tasks are not affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleLoadSpace(space)}>Load Space</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                <Sparkles className="mx-auto h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Start Your Journey</h4>
                <p className="text-sm mb-4">Create tasks and build your first workflow. Once you're happy with it, you can save it here as a reusable space!</p>
                {tasks.length > 0 ? (
                   <Button asChild>
                    <Link href="/settings/workflow">Save Your First Space <ArrowRight className="ml-2 h-4 w-4"/></Link>
                  </Button>
                ) : (
                   <Button asChild>
                    <Link href="/tasks">Create Your First Task <ArrowRight className="ml-2 h-4 w-4"/></Link>
                  </Button>
                )}
            </div>
          )}
        </CardContent>
        <CardFooter>
           <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/settings/workflow">Manage All Spaces <ArrowRight className="ml-1 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Library className="text-primary"/>Template Library</CardTitle>
          <CardDescription>Add a ready-made marketing playbook to your board.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
              {featuredTemplates.map(template => (
                <div key={template.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={isLoading} onClick={() => handleAddTemplate(template)}>
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                    <span className="ml-2">Add</span>
                  </Button>
                </div>
              ))}
            </div>
        </CardContent>
         <CardFooter>
           <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/library">View all templates <ArrowRight className="ml-1 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
