"use client";

import type { AIInsights } from "@/types";
import { InsightCard } from "./InsightCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CompletionChart } from "@/components/charts/CompletionChart";
import { 
    CheckCircle, 
    TrendingUp, 
    Clock, 
    AlertTriangle, 
    PauseCircle, 
    Sparkles, 
    List,
    Info
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface InsightsDisplayProps {
  insights: AIInsights;
}

export function InsightsDisplay({ insights }: InsightsDisplayProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>AI Summary & Productivity Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center justify-center gap-2">
                <div className="relative h-24 w-24">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            className="text-muted"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            className="text-primary"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${insights.productivityScore}, 100`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{insights.productivityScore}</span>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground font-semibold">Productivity Score</p>
            </div>
            <div className="flex-1">
                <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>AI Analysis</AlertTitle>
                    <AlertDescription>{insights.summary}</AlertDescription>
                </Alert>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          title="Weekly Completions"
          value={insights.completionRate.weekly}
          icon={TrendingUp}
          description={`${insights.completionRate.daily} tasks completed today`}
        />
        <InsightCard
          title="Avg. Completion Time"
          value={`${insights.averageCompletionTimeHours.toFixed(1)} hrs`}
          icon={Clock}
          description="From creation to completion"
        />
        <InsightCard
          title="At-Risk Tasks"
          value={insights.atRiskTasks.length}
          icon={AlertTriangle}
          description="Due soon or overdue"
          className={insights.atRiskTasks.length > 0 ? "bg-destructive/10 border-destructive" : ""}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="text-primary"/>Proactive Suggestions</CardTitle>
            <CardDescription>Actionable tips from your AI assistant to improve your workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
                {insights.proactiveSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{suggestion}</p>
                    </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PauseCircle className="text-primary"/>Stalled Tasks</CardTitle>
                <CardDescription>Tasks that haven&apos;t been updated recently and may need attention.</CardDescription>
            </CardHeader>
            <CardContent>
                 {insights.stalledTasks.length > 0 ? (
                    <ul className="space-y-2">
                        {insights.stalledTasks.map(task => (
                            <li key={task.taskId} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium text-sm">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">Last updated: {new Date(task.lastUpdate).toLocaleDateString()}</p>
                                </div>
                                <Button size="sm" variant="outline" asChild><Link href={`/tasks#${task.taskId}`}>View Task</Link></Button>
                            </li>
                        ))}
                    </ul>
                 ) : (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Stalled Tasks!</AlertTitle>
                        <AlertDescription>Great job! All your active tasks have been updated recently.</AlertDescription>
                    </Alert>
                 )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
