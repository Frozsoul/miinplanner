"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Library, Loader2, Plus, Replace, Sparkles, CalendarDays, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import {
  taskSpaceTemplates, templateToTasks, TEMPLATE_STATUSES,
  type MarketingTemplate, type TemplateCategory,
} from "@/lib/task-space-templates";

const CATEGORIES: ("All" | TemplateCategory)[] = ["All", "Local", "Social", "Campaign", "Website", "Content", "Email"];

export default function LibraryPage() {
  const { addTasks, importTaskSpace, taskStatuses, currentWorkspace } = useAppData();
  const { toast } = useToast();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [preview, setPreview] = useState<MarketingTemplate | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<MarketingTemplate | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const templates = useMemo(
    () => category === "All" ? taskSpaceTemplates : taskSpaceTemplates.filter(t => t.category === category),
    [category],
  );

  const handleAdd = async (template: MarketingTemplate) => {
    setBusyId(template.id);
    try {
      const count = await addTasks(templateToTasks(template, new Date(), taskStatuses[0] || "To Do"));
      toast({
        title: `${count} tasks added`,
        description: `"${template.name}" was added to ${currentWorkspace ? `"${currentWorkspace.name}"` : "your board"} with due dates from today. Nothing else was changed.`,
      });
      setPreview(null);
    } catch (err) {
      console.error("Adding template failed:", err);
      toast({ title: "Couldn't add the template", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleReplace = async (template: MarketingTemplate) => {
    setBusyId(template.id);
    await importTaskSpace({
      name: template.name,
      tasks: templateToTasks(template, new Date(), TEMPLATE_STATUSES[0]),
      taskStatuses: TEMPLATE_STATUSES,
      createdAt: new Date(),
    });
    setBusyId(null);
    setReplaceTarget(null);
    setPreview(null);
  };

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Template library"
        description="Proven marketing playbooks for small businesses. Add one to your board and every task gets a due date from today."
        icon={Library}
      />

      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold">Want a plan written for your business?</p>
            <p className="text-sm text-muted-foreground">The AI marketing planner builds a custom plan from your goal, channels and time.</p>
          </div>
          <Button asChild>
            <Link href="/planner"><Sparkles className="mr-2 h-4 w-4" />Build my plan</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{template.category}</Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><ListChecks className="h-4 w-4" />{template.tasks.length} tasks</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{template.durationDays} days</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(template)}>Preview</Button>
              <Button className="flex-1" disabled={busyId !== null} onClick={() => handleAdd(template)}>
                {busyId === template.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add to board
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription>{preview.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh] pr-3">
                <ol className="space-y-3">
                  {preview.tasks.map((task, i) => (
                    <li key={i} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-14">Day {task.dayOffset + 1}</span>
                        <span className="font-medium">{task.title}</span>
                        <Badge variant="outline" className="ml-auto">{task.channel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 sm:pl-16">{task.description}</p>
                    </li>
                  ))}
                </ol>
              </ScrollArea>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:justify-between">
                <Button variant="ghost" disabled={busyId !== null} onClick={() => setReplaceTarget(preview)}>
                  <Replace className="mr-2 h-4 w-4" />Replace my board instead
                </Button>
                <Button disabled={busyId !== null} onClick={() => handleAdd(preview)}>
                  {busyId === preview.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add {preview.tasks.length} tasks to board
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!replaceTarget} onOpenChange={open => !open && setReplaceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your personal board?</AlertDialogTitle>
            <AlertDialogDescription>
              Your personal board will be cleared and replaced with &quot;{replaceTarget?.name}&quot;. Your current board is saved to Saved Spaces first, so you can switch back. Workspace tasks are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => replaceTarget && handleReplace(replaceTarget)}>Replace board</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
