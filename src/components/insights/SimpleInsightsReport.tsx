
"use client";

import type { SimpleInsights } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { InsightCard } from "./InsightCard";

interface SimpleInsightsReportProps {
  insights: SimpleInsights;
}

export function SimpleInsightsReport({ insights }: SimpleInsightsReportProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Snapshot</CardTitle>
        <CardDescription>
          Real-time metrics from your current task board.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border">
            <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Volume</span>
            </div>
            <span className="text-xl font-bold">{insights.totalTasks}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border">
            <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-secondary-foreground" />
                <span className="text-sm font-medium">Active Tasks</span>
            </div>
            <span className="text-xl font-bold">{insights.tasksToDo}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Urgent Focus</span>
            </div>
            <span className="text-xl font-bold text-destructive">{insights.highPriorityTasks}</span>
          </div>
        </div>

        <Alert className="bg-accent/10 border-accent/20">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <AlertDescription className="text-xs">
            {insights.message}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
