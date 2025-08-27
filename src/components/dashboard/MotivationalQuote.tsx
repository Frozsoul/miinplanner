
"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardQuotes, tasksQuotes, calendarQuotes } from "@/lib/quotes";
import type { GenerateQuoteInput } from "@/types";

interface MotivationalQuoteProps {
  context: GenerateQuoteInput['context'];
}

const quotesMap = {
    dashboard: dashboardQuotes,
    tasks: tasksQuotes,
    calendar: calendarQuotes,
};

export function MotivationalQuote({ context }: MotivationalQuoteProps) {
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    // Select a random quote on the client-side to avoid hydration mismatch
    const quoteList = quotesMap[context];
    const randomQuote = quoteList[Math.floor(Math.random() * quoteList.length)];
    setQuote(randomQuote);
  }, [context]);

  if (!quote) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground italic mt-1">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <Skeleton className="h-4 w-full max-w-sm" />
        </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground italic flex items-center gap-2 mt-1">
       <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
       {`"${quote}"`}
    </p>
  );
}
