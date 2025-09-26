
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Library, Download, Wand2 } from "lucide-react";
import { taskSpaceTemplates } from "@/lib/task-space-templates";
import { useAppData } from "@/contexts/app-data-context";
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
import type { TaskSpace } from "@/types";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


export default function LibraryPage() {
  const { loadTaskSpaceTemplate, saveCurrentTaskSpace, tasks } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [templateToLoad, setTemplateToLoad] = useState<Omit<TaskSpace, 'id'> | null>(null);
  const { toast } = useToast();
  
  const handleLoadTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    setIsLoading(true);
    await loadTaskSpaceTemplate(template);
    setIsLoading(false);
  };
  
  const handleSaveAndLoad = async () => {
    if (!newSpaceName.trim()) {
      toast({ title: "Error", description: "Task space name cannot be empty.", variant: "destructive" });
      return;
    }
    if (!templateToLoad) return;

    setIsSaving(true);
    await saveCurrentTaskSpace(newSpaceName);
    setNewSpaceName("");
    setIsSaving(false);
    setShowSaveDialog(false);
    
    // Proceed to load the template
    await handleLoadTemplate(templateToLoad);
    setTemplateToLoad(null);
  };

  const openConfirmationDialog = (template: Omit<TaskSpace, 'id'>) => {
    setTemplateToLoad(template);
  };
  
  const openSaveDialog = () => {
    setShowSaveDialog(true);
  };


  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
       <PageHeader
        title="Template Library"
        description="Get started quickly by loading a pre-built template for your projects."
        icon={Library}
      />

        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 />Featured Templates</CardTitle>
            <CardDescription>
                Loading a template will replace your current tasks and statuses. This action cannot be undone.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskSpaceTemplates.map((template) => (
                <Card key={template.name} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
                <CardFooter>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={isLoading} onClick={() => openConfirmationDialog(template)}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                        <span className="ml-2">Load</span>
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Load Template: &quot;{template.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action will replace all your current tasks and statuses. Would you like to save your current workspace first?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleLoadTemplate(template)}>Load Template</AlertDialogAction>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="default" disabled={tasks.length === 0}>Save & Load</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Save Current Workspace</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter a name for your current workspace before loading the new template.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Input 
                                        placeholder="e.g., Q3 Marketing Plan"
                                        value={newSpaceName}
                                        onChange={(e) => setNewSpaceName(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSaveAndLoad} disabled={isSaving || !newSpaceName.trim()}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Save & Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
                </Card>
            ))}
            </CardContent>
        </Card>
    </div>
  );
}
