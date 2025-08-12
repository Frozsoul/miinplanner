
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppData } from "@/contexts/app-data-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { GreetingContext } from "@/types";

interface DashboardAIInsightProps {
  pageContext: GreetingContext;
}

export function DashboardAIInsight({ pageContext }: DashboardAIInsightProps) {
  const { 
    greetings,
    fetchGreeting, 
    isLoadingGreeting, 
    tasks, 
    isLoadingTasks 
  } = useAppData();
  const { user } = useAuth();
  
  const currentGreeting = greetings[pageContext];

  useEffect(() => {
    // We want to fetch the greeting only when tasks are loaded.
    if (!isLoadingTasks && tasks.length > 0) {
      fetchGreeting(pageContext);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTasks, tasks.length, pageContext]); 
  
  const getGreetingTitle = () => {
    const hour = new Date().getHours();
    const displayName = user?.displayName?.split(' ')[0] || 'there';

    if (pageContext === 'dashboard') {
        if (hour < 12) {
          return `Good morning, ${displayName}!`;
        }
        if (hour < 18) {
          return `Good afternoon, ${displayName}!`;
        }
        return `Good evening, ${displayName}!`;
    }
    if (pageContext === 'tasks') {
        return "Your Task Briefing";
    }
    if (pageContext === 'calendar') {
        return "Your Week Ahead";
    }
    return "Your Daily Brief";
  };
  
  const isGreetingLoading = isLoadingGreeting[pageContext] ?? false;

  if (isLoadingTasks || (!currentGreeting && tasks.length > 0)) {
     return (
        <Alert className="flex items-center justify-between">
            <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-3 text-primary" />
                <div>
                    <AlertTitle className="font-semibold">{getGreetingTitle()}</AlertTitle>
                    <AlertDescription className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI is preparing your summary...
                    </AlertDescription>
                </div>
            </div>
        </Alert>
     )
  }

  // Don't show the card if there are no tasks and we are not loading.
  if (!isLoadingTasks && tasks.length === 0) {
    return null;
  }

  return (
    <Alert className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start">
        <Sparkles className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
        <div>
          <AlertTitle className="font-semibold text-base">{getGreetingTitle()}</AlertTitle>
          <AlertDescription>
            {isGreetingLoading ? (
              <span className="flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</span>
            ) : (
              currentGreeting?.greeting || "Welcome! Let's get planning."
            )}
          </AlertDescription>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="w-full sm:w-auto flex-shrink-0">
        <Link href="/insights">
          Go to Full Insights <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </Alert>
  );
}
