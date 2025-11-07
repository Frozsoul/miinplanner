
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
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

export default function ChatbotPage() {
  const { user, userProfile, updateUserProfile, fetchUserProfile, loading: authLoading } = useAuth();

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
      if (messages.length === 0 || messages[messages.length-1].sender !== 'system') {
        setMessages(prev => [...prev, {
            id: 'limit-message',
            sender: 'system',
            text: `You have reached your daily message limit of ${CHATBOT_DAILY_LIMIT}. Please check back tomorrow!`,
            timestamp: new Date()
        }]);
      }
    } else {
      setIsLimitReached(false);
    }
  }, [userProfile, messages]);


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
       // --- Usage Limit Logic ---
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
      // --- End Usage Limit Logic ---


      const aiInput: SuggestProductivityTipsInput = { query: input };
      const aiResponse = await suggestProductivityTips(aiInput);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponse.tips,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      if (isLimitReached) {
           setMessages(prev => [...prev, {
            id: 'limit-message-after-send',
            sender: 'system',
            text: `You have reached your daily message limit of ${CHATBOT_DAILY_LIMIT}. Please check back tomorrow!`,
            timestamp: new Date()
        }]);
      }

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

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const remainingMessages = userProfile?.lastChatbotMessageDate === format(new Date(), "yyyy-MM-dd")
    ? CHATBOT_DAILY_LIMIT - (userProfile?.chatbotMessageCount || 0)
    : CHATBOT_DAILY_LIMIT;


  return (
    <div className="px-4 sm:px-6 md:py-6 h-full flex flex-col">
      <h1 className="text-3xl font-headline font-bold mb-4 text-center">AI Productivity Assistant</h1>
      <div className="flex justify-center items-center gap-2 mb-4 text-sm text-muted-foreground">
        {isLimitReached ? <ShieldOff className="h-4 w-4 text-destructive"/> : <ShieldCheck className="h-4 w-4 text-green-500"/>}
        <span>
            {isLimitReached
                ? "Daily limit reached"
                : `${Math.max(0, remainingMessages)} messages remaining today`
            }
        </span>
      </div>

      <Card className="flex-1 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Chat with MiinBot</CardTitle>
          <CardDescription>Your personal AI assistant for boosting productivity and optimizing workflows.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-22rem)] pr-4" ref={scrollAreaRef}> {/* Adjust height as needed */}
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  {msg.sender === "ai" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                  )}
                   {msg.sender === 'system' && (
                    <div className="w-full flex justify-center">
                        <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded-md">
                           {msg.text}
                        </div>
                    </div>
                  )}

                  {msg.sender !== 'system' && (
                     <div className={cn("max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md", msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  )}
                 
                  {msg.sender === "user" && (
                     <Avatar className="h-8 w-8">
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md bg-secondary text-secondary-foreground">
                       <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                 </div>
              )}
            </div>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BotMessageSquare className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">Ask me anything about productivity!</p>
                <p className="text-sm">e.g., "How can I better manage my time?"</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLimitReached ? "Daily limit reached. Check back tomorrow." : "Type your productivity question here..."}
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || isLimitReached}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || input.trim() === "" || isLimitReached} className="h-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
}
