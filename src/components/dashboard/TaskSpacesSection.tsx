
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
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
import { taskSpaceTemplates } from "@/lib/task-space-templates";

export function TaskSpacesSection() {
  const { 
    taskSpaces, 
    fetchTaskSpaces, 
    loadTaskSpace, 
    loadTaskSpaceTemplate
  } = useAppData();
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

  const handleLoadTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    setIsLoading(true);
    await loadTaskSpaceTemplate(template);
    setIsLoading(false);
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
                        <AlertDialogTitle>Load Task Space?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will replace all your current tasks and statuses with the ones from &quot;{space.name}&quot;. This action cannot be undone.
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
                <Button asChild>
                    <Link href="/tasks">Create Your First Task <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
           <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/settings">Manage All Spaces <ArrowRight className="ml-1 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Library className="text-primary"/>Template Library</CardTitle>
          <CardDescription>Start a new project with a pre-built template.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
              {featuredTemplates.map(template => (
                <div key={template.name} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isLoading}>
                         {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                        <span className="ml-2">Load</span>
                      </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Load Template: &quot;{template.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will replace all of your current tasks and custom statuses. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleLoadTemplate(template)}>Load Template</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
        </CardContent>
         <CardFooter>
           <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/settings">View All Templates <ArrowRight className="ml-1 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
