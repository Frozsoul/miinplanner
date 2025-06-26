"use client";

import type { SimpleInsights } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ListChecks, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InsightCard } from "./InsightCard";

interface SimpleInsightsReportProps {
  insights: SimpleInsights;
}

export function SimpleInsightsReport({ insights }: SimpleInsightsReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/>Basic Insights</CardTitle>
        <CardDescription>
          Here&apos;s a quick look at your current tasks. Keep adding and updating tasks to unlock advanced AI analytics!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard title="Total Tasks" value={insights.totalTasks} icon={ListChecks} />
          <InsightCard title="Tasks To Do" value={insights.tasksToDo} icon={ListChecks} />
          <InsightCard title="High Priority" value={insights.highPriorityTasks} icon={ListChecks} />
        </div>
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Unlock Full Power!</AlertTitle>
          <AlertDescription>
            {insights.message}
          </AlertDescription>
        </Alert>
         <div className="text-center">
            <Button asChild>
                <Link href="/tasks">Go to Task Manager <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
