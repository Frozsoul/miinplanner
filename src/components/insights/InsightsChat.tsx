"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { suggestProductivityTips, type SuggestProductivityTipsInput } from "@/ai/flows/suggest-marketing-tips";
import { Bot, User, Send, Loader2, Sparkles, BotMessageSquare, ShieldCheck, ShieldOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { format } from 'date-fns';

const CHATBOT_DAILY_LIMIT = 10;

interface InsightsChatProps {
  tasks: Task[];
}

export function InsightsChat({ tasks }: InsightsChatProps) {
  const { user, userProfile, updateUserProfile } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const checkUsageLimit = useCallback(() => {
    if (!userProfile) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const lastDate = userProfile.lastChatbotMessageDate;
    const currentCount = userProfile.chatbotMessageCount || 0;

    if (lastDate === todayStr && currentCount >= CHATBOT_DAILY_LIMIT) {
      setIsLimitReached(true);
    } else {
      setIsLimitReached(false);
    }
  }, [userProfile]);

  useEffect(() => {
    checkUsageLimit();
  }, [checkUsageLimit]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLimitReached) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (user?.uid && userProfile) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const isNewDay = userProfile.lastChatbotMessageDate !== todayStr;
        const newCount = isNewDay ? 1 : (userProfile.chatbotMessageCount || 0) + 1;
        
        await updateUserProfile({
          chatbotMessageCount: newCount,
          lastChatbotMessageDate: todayStr,
        });

        if (newCount >= CHATBOT_DAILY_LIMIT) {
            setIsLimitReached(true);
        }
      }

      const aiInput: SuggestProductivityTipsInput = { 
        query: input,
        tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate
        }))
      };
      const aiResponse = await suggestProductivityTips(aiInput);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponse.tips,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const remainingMessages = userProfile?.lastChatbotMessageDate === format(new Date(), "yyyy-MM-dd")
    ? CHATBOT_DAILY_LIMIT - (userProfile?.chatbotMessageCount || 0)
    : CHATBOT_DAILY_LIMIT;

  return (
    <Card className="shadow-xl border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-accent" /> 
                    Follow-up with MiinBot
                </CardTitle>
                <CardDescription>Ask for specific advice based on these insights and your tasks.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {isLimitReached ? <ShieldOff className="h-3 w-3 text-destructive"/> : <ShieldCheck className="h-3 w-3 text-green-500"/>}
                <span>{isLimitReached ? "Limit reached" : `${Math.max(0, remainingMessages)} left`}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === "user" ? "justify-end" : "justify-start")}>
                {msg.sender === "ai" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-secondary"><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "max-w-[85%] rounded-xl px-4 py-2 text-sm shadow-sm", 
                    msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                )}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-[10px] opacity-50 mt-1">{format(msg.timestamp, "h:mm a")}</p>
                </div>
                {msg.sender === "user" && (
                   <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted border rounded-xl px-4 py-2">
                     <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
               </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BotMessageSquare className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Ready to discuss your tasks!</p>
                <p className="text-xs">e.g., "How should I prioritize my urgent tasks?"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLimitReached ? "Daily limit reached." : "Type a follow-up question..."}
            className="flex-1 resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || isLimitReached}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={isLoading || input.trim() === "" || isLimitReached}
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
