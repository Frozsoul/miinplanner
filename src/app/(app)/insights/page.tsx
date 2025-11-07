
"use client";

import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Lightbulb, Wand2, Loader2, Info } from "lucide-react";
import { InsightsDisplay } from "@/components/insights/InsightsDisplay";
import { SimpleInsightsReport } from "@/components/insights/SimpleInsightsReport";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function InsightsPage() {
  const { insights, generateInsights, isLoadingAi } = useAppData();
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
        title="AI Insights"
        description="Get data-driven insights and recommendations to boost your productivity."
        icon={Lightbulb}
        actionButtons={
          <Button onClick={handleGenerate} disabled={isLoadingAi}>
            <Wand2 className="mr-2 h-5 w-5" />
            {isLoadingAi ? "Analyzing..." : "Generate Insights"}
          </Button>
        }
      />
      
      <div className="container mx-auto">
        {isLoadingAi && (
          <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-xl font-semibold">Analyzing Your Workflow...</h3>
                  <p className="text-muted-foreground">The AI is crunching the numbers to find valuable insights. This may take a moment.</p>
                </div>
            </CardContent>
          </Card>
        )}

        {!isLoadingAi && !insights && (
           <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Welcome to AI Insights!</AlertTitle>
            <AlertDescription>
              Click the &quot;Generate Insights&quot; button to analyze your tasks and get personalized recommendations.
            </AlertDescription>
          </Alert>
        )}

        {!isLoadingAi && insights && (
          <>
            {insights.type === 'full' && <InsightsDisplay insights={insights} />}
            {insights.type === 'simple' && <SimpleInsightsReport insights={insights} />}
          </>
        )}
      </div>
    </div>
  );
}
