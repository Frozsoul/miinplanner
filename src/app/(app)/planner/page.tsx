"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { Loader2, Sparkles, CalendarPlus, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { generateMarketingPlan, type MarketingPlan } from "@/ai/flows/generate-marketing-plan";
import type { TaskData } from "@/types";

const PLAN_DAILY_LIMIT = 3;

const CHANNEL_OPTIONS = [
  "Facebook", "Instagram", "TikTok", "Zalo", "LinkedIn",
  "Google Business Profile", "Website / Blog", "Email", "Offline / In-store",
];

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Urgent: "destructive",
  High: "default",
  Medium: "secondary",
  Low: "outline",
};

export default function MarketingPlannerPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { addTasks, taskStatuses, currentWorkspace } = useAppData();
  const { toast } = useToast();

  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [channels, setChannels] = useState<string[]>(["Facebook", "Google Business Profile"]);
  const [durationDays, setDurationDays] = useState("30");
  const [hoursPerWeek, setHoursPerWeek] = useState("5");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const usedToday = userProfile?.lastMarketingPlanDate === todayStr ? (userProfile?.marketingPlanCount || 0) : 0;
  const remaining = Math.max(PLAN_DAILY_LIMIT - usedToday, 0);
  const canGenerate = businessType.trim().length >= 2 && goal.trim().length >= 3 && channels.length > 0 && remaining > 0;

  const toggleChannel = (channel: string) => {
    setChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;
    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await generateMarketingPlan(idToken, {
        businessType,
        goal,
        audience: audience.trim() || undefined,
        channels,
        durationDays: Number(durationDays),
        hoursPerWeek: Number(hoursPerWeek) || 5,
      });
      if (!response.ok) {
        toast({ title: "Couldn't generate a plan", description: response.message, variant: "destructive" });
        if (response.code === "limit_reached") {
          await updateUserProfile({ marketingPlanCount: PLAN_DAILY_LIMIT, lastMarketingPlanDate: todayStr });
        }
        return;
      }
      const result = response.data;
      setPlan(result);
      setSelected(new Set(result.tasks.map((_, i) => i)));
      await updateUserProfile({ marketingPlanCount: usedToday + 1, lastMarketingPlanDate: todayStr });
    } catch (error) {
      console.error("Marketing plan generation failed:", error);
      toast({
        title: "Couldn't generate a plan",
        description: "The AI service didn't respond. Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const start = useMemo(() => {
    const d = new Date(`${startDate}T09:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startDate]);

  // Group tasks by week of the plan for a readable preview.
  const weeks = useMemo(() => {
    if (!plan) return [];
    const groups: { week: number; items: { task: MarketingPlan["tasks"][number]; index: number }[] }[] = [];
    plan.tasks.forEach((task, index) => {
      const week = Math.floor(task.dayOffset / 7) + 1;
      let group = groups.find(g => g.week === week);
      if (!group) {
        group = { week, items: [] };
        groups.push(group);
      }
      group.items.push({ task, index });
    });
    return groups.sort((a, b) => a.week - b.week);
  }, [plan]);

  const handleAddToBoard = async () => {
    if (!plan || selected.size === 0) return;
    setIsAdding(true);
    const firstStatus = taskStatuses[0] || "To Do";
    const tasksToAdd: TaskData[] = plan.tasks
      .filter((_, i) => selected.has(i))
      .map(t => {
        const due = addDays(start, t.dayOffset);
        return {
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: firstStatus,
          channel: t.channel,
          tags: Array.from(new Set(["ai-plan", ...t.tags])),
          startDate: due.toISOString(),
          dueDate: due.toISOString(),
          archived: false,
        };
      });
    try {
      const count = await addTasks(tasksToAdd);
      toast({
        title: `${count} tasks added`,
        description: `Added to ${currentWorkspace ? `"${currentWorkspace.name}"` : "your personal board"}. Your existing tasks were not changed.`,
      });
      setPlan(null);
      setSelected(new Set());
    } catch (error) {
      console.error("Adding plan tasks failed:", error);
      toast({ title: "Couldn't add tasks", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="AI Marketing Planner"
        description="Tell us about your business and goal. Get a day-by-day marketing plan you can drop straight into your board."
        icon={Sparkles}
      />

      {!plan && (
        <Card>
          <CardHeader>
            <CardTitle>Your business</CardTitle>
            <CardDescription>
              The more specific you are, the more useful the plan. {remaining} of {PLAN_DAILY_LIMIT} plans left today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessType">What's your business?</Label>
                <Input id="businessType" maxLength={120} placeholder="e.g. Family bakery in Hanoi's Old Quarter"
                  value={businessType} onChange={e => setBusinessType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Who are your customers? (optional)</Label>
                <Input id="audience" maxLength={200} placeholder="e.g. Office workers nearby, tourists, party orders"
                  value={audience} onChange={e => setAudience(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">What do you want to achieve?</Label>
              <Textarea id="goal" maxLength={300} rows={2}
                placeholder="e.g. Get 20 more birthday cake orders per month before Tet"
                value={goal} onChange={e => setGoal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Channels you can use</Label>
              <div className="flex flex-wrap gap-3">
                {CHANNEL_OPTIONS.map(channel => (
                  <label key={channel} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2">
                    <Checkbox checked={channels.includes(channel)} onCheckedChange={() => toggleChannel(channel)} />
                    {channel}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Plan length</Label>
                <Select value={durationDays} onValueChange={setDurationDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time per week</Label>
                <Select value={hoursPerWeek} onValueChange={setHoursPerWeek}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">About 2 hours</SelectItem>
                    <SelectItem value="5">About 5 hours</SelectItem>
                    <SelectItem value="10">About 10 hours</SelectItem>
                    <SelectItem value="20">20+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {remaining === 0 ? "Daily limit reached. Come back tomorrow." : "Takes about 15 seconds."}
            </p>
            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGenerating ? "Building your plan..." : "Generate my plan"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{plan.planName}</CardTitle>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button variant="outline" onClick={() => setPlan(null)} disabled={isAdding}>
                <RotateCcw className="mr-2 h-4 w-4" /> Start over
              </Button>
              <Button onClick={handleAddToBoard} disabled={isAdding || selected.size === 0}>
                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                Add {selected.size} tasks to my board
              </Button>
            </CardFooter>
          </Card>

          {weeks.map(({ week, items }) => (
            <Card key={week}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Week {week}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map(({ task, index }) => (
                  <label key={index} className="flex gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      className="mt-1"
                      checked={selected.has(index)}
                      onCheckedChange={() => setSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(index)) next.delete(index); else next.add(index);
                        return next;
                      })}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant={PRIORITY_VARIANT[task.priority] || "secondary"}>{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(addDays(start, task.dayOffset), "EEE d MMM")} · {task.channel}
                      </p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}

          <p className="text-sm text-muted-foreground text-center">
            Want someone to run this plan for you?{" "}
            <Link href="https://miindigital.com/?utm_source=miinplanner&utm_medium=app&utm_campaign=ai_planner"
              target="_blank" rel="noopener noreferrer" className="underline font-medium">
              Talk to MiinDigital
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
