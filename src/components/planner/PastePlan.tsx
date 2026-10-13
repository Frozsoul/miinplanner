"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Check, ClipboardPaste, Copy, CalendarPlus, Loader2, ExternalLink, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PRIORITY_PILL } from "@/lib/task-colors";
import { buildPlanPrompt, parsePastedPlan, type ParsedPlanTask } from "@/lib/plan-import";
import type { TaskData } from "@/types";

function dueDateFor(task: ParsedPlanTask, start: Date): Date {
  if (task.date) return new Date(`${task.date}T09:00:00`);
  return addDays(start, task.dayOffset ?? 0);
}

export function PastePlan() {
  const { addTasks, taskStatuses, currentWorkspace } = useAppData();
  const { toast } = useToast();

  const [business, setBusiness] = useState("");
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState("30");
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const [unticked, setUnticked] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isAdding, setIsAdding] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const prompt = useMemo(() => buildPlanPrompt(business, goal, Number(days)), [business, goal, days]);
  const parsed = useMemo(() => parsePastedPlan(pasted), [pasted]);
  const start = useMemo(() => {
    const d = new Date(`${startDate}T09:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startDate]);
  const selectedCount = parsed.tasks.length - Array.from(unticked).filter(i => i < parsed.tasks.length).length;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the prompt and copy it manually.", variant: "destructive" });
    }
  };

  const handlePaste = (value: string) => {
    setPasted(value);
    setUnticked(new Set());
    setAddedCount(null);
  };

  const toggle = (index: number) => setUnticked(prev => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });

  const handleAdd = async () => {
    const chosen = parsed.tasks.filter((_, i) => !unticked.has(i));
    if (chosen.length === 0) return;
    setIsAdding(true);
    const status = taskStatuses[0] || "To Do";
    const tasksToAdd: TaskData[] = chosen.map(t => {
      const due = dueDateFor(t, start).toISOString();
      return {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status,
        channel: t.channel,
        tags: ["ai-import"],
        startDate: due,
        dueDate: due,
        archived: false,
      };
    });
    try {
      const count = await addTasks(tasksToAdd);
      setAddedCount(count);
      setPasted("");
      setUnticked(new Set());
      toast({
        title: `${count} tasks added`,
        description: `Added to ${currentWorkspace ? `"${currentWorkspace.name}"` : "your personal board"}. Your existing tasks were not changed.`,
      });
    } catch (error) {
      console.error("Adding pasted plan failed:", error);
      toast({ title: "Couldn't add tasks", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const chatgptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;

  return (
    <div className="space-y-6">
      {addedCount !== null && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{addedCount} tasks are on your board.</p>
              <p className="text-sm text-muted-foreground">Get a reminder on your phone the day each one is due.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline"><Link href="/tasks">Open board</Link></Button>
              <Button asChild><Link href="/settings/reminders"><Bell className="mr-2 h-4 w-4" />Turn on reminders</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Ask your AI</CardTitle>
          <CardDescription>
            Fill in your business and goal, then open ChatGPT or Claude with the prompt ready, or copy it into any AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_160px]">
            <div className="space-y-2">
              <Label htmlFor="pp-business">Your business</Label>
              <Input id="pp-business" maxLength={120} placeholder="e.g. Family bakery in Hanoi" value={business} onChange={e => setBusiness(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-goal">Your goal</Label>
              <Input id="pp-goal" maxLength={200} placeholder="e.g. 20 more cake orders a month" value={goal} onChange={e => setGoal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plan length</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea readOnly value={prompt} rows={6} className="font-mono text-xs" onFocus={e => e.currentTarget.select()} aria-label="Prompt to copy" />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={chatgptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open in ChatGPT</a>
          </Button>
          <Button asChild variant="outline">
            <a href={claudeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open in Claude</a>
          </Button>
          <Button variant="outline" onClick={copyPrompt}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Paste the answer</CardTitle>
          <CardDescription>Copy the whole reply and paste it here. Tables, lists and CSV all work.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={pasted}
            onChange={e => handlePaste(e.target.value)}
            rows={6}
            placeholder={"| Day | Task | Details | Channel | Priority |\n| 1 | Update Google Business Profile | Add hours and 5 photos | Google Business Profile | High |"}
            aria-label="Paste your AI's answer"
          />
          {pasted.trim() && parsed.tasks.length === 0 && (
            <p className="mt-2 text-sm text-destructive">
              No tasks found. Make sure you pasted the table, or ask your AI to &quot;reply only with the table&quot;.
            </p>
          )}
        </CardContent>
      </Card>

      {parsed.tasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">3. Pick the tasks to add</CardTitle>
            <CardDescription>
              {selectedCount} of {parsed.tasks.length} selected.
              {parsed.skipped > 0 && ` ${parsed.skipped} rows had no task or day and were skipped.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
              <Label htmlFor="pp-start">Day 1 is</Label>
              <Input id="pp-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-3">
              {parsed.tasks.map((task, index) => (
                <label key={index} className="flex gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                  <Checkbox className="mt-1" checked={!unticked.has(index)} onCheckedChange={() => toggle(index)} />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className={cn(PRIORITY_PILL[task.priority])}>{task.priority}</Badge>
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {format(dueDateFor(task, start), "EEE d MMM")} · {task.channel}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleAdd} disabled={isAdding || selectedCount === 0}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
              Add {selectedCount} {selectedCount === 1 ? "task" : "tasks"} to my board
            </Button>
          </CardFooter>
        </Card>
      )}

      {parsed.tasks.length === 0 && !pasted.trim() && addedCount === null && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4" /> Works with ChatGPT, Claude, Gemini, Copilot or any AI that can make a table.
        </p>
      )}
    </div>
  );
}
