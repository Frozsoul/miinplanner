
"use client";

import { useEffect, useState, useMemo } from "react";
import { generateMotivationalQuote, type GenerateQuoteInput } from "@/ai/flows/generate-motivational-quote";
import { Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MotivationalQuoteProps {
  context: GenerateQuoteInput['context'];
}

// Store quotes in session storage to avoid re-fetching on every navigation
const getSessionQuote = (context: string) => {
    if (typeof window === 'undefined') return null;
    const item = window.sessionStorage.getItem(`quote-${context}`);
    if (!item) return null;
    try {
        const { quote, expiry } = JSON.parse(item);
        if (new Date().getTime() > expiry) {
            window.sessionStorage.removeItem(`quote-${context}`);
            return null;
        }
        return quote;
    } catch (e) {
        return null;
    }
}

const setSessionQuote = (context: string, quote: string) => {
    if (typeof window === 'undefined') return;
    const expiry = new Date().getTime() + 15 * 60 * 1000; // Cache for 15 minutes
    const item = JSON.stringify({ quote, expiry });
    window.sessionStorage.setItem(`quote-${context}`, item);
}


export function MotivationalQuote({ context }: MotivationalQuoteProps) {
  const [quote, setQuote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const cachedQuote = getSessionQuote(context);
      if (cachedQuote) {
        setQuote(cachedQuote);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const newQuote = await generateMotivationalQuote({ context });
      setQuote(newQuote);
      setSessionQuote(context, newQuote);
      setIsLoading(false);
    };

    fetchQuote();
  }, [context]);

  if (isLoading) {
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
