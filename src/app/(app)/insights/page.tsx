
"use client";

import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Lightbulb, Wand2, Loader2, BarChart3, TrendingUp } from "lucide-react";
import { InsightsDisplay } from "@/components/insights/InsightsDisplay";
import { SimpleInsightsReport } from "@/components/insights/SimpleInsightsReport";
import { InsightsChat } from "@/components/insights/InsightsChat";
import { CompletionChart } from "@/components/charts/CompletionChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function InsightsPage() {
  const { insights, simpleInsights, completionHistory, generateInsights, isLoadingAi, tasks } = useAppData();
  const { loading: authLoading } = useAuth();

  const handleGenerate = () => {
    generateInsights();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Insights Hub"
        description="Track your productivity history and get personalized AI recommendations."
        icon={Lightbulb}
        actionButtons={
          <Button onClick={handleGenerate} disabled={isLoadingAi || tasks.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Wand2 className="mr-2 h-5 w-5" />
            {isLoadingAi ? "Analyzing..." : "Generate AI Insights"}
          </Button>
        }
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Row 1: Simple Stats & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <SimpleInsightsReport insights={simpleInsights} />
            </div>
            <div className="lg:col-span-2">
                <CompletionChart data={completionHistory} />
            </div>
        </div>

        {/* Row 2: AI Insights (Conditional) */}
        {isLoadingAi ? (
          <Card className="border-accent/30 animate-pulse">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                  <h3 className="text-xl font-semibold">Consulting MiinBot...</h3>
                  <p className="text-muted-foreground">The AI is reviewing your tasks to find opportunities for optimization.</p>
                </div>
            </CardContent>
          </Card>
        ) : insights ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <InsightsDisplay insights={insights} />
                <InsightsChat tasks={tasks} />
            </div>
        ) : (
            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Unlock Personalized Recommendations
                    </CardTitle>
                    <CardDescription>
                        Click the &quot;Generate AI Insights&quot; button above to receive a deep-dive analysis of your workflow and proactive suggestions from MiinBot.
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </div>
  );
}
