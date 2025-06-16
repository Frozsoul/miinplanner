
"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { suggestMarketingTips, type SuggestMarketingTipsInput } from "@/ai/flows/suggest-marketing-tips";
import { Bot, User, Send, Loader2, Sparkles, BotMessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

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
      const aiInput: SuggestMarketingTipsInput = { query: input };
      const aiResponse = await suggestMarketingTips(aiInput);
      
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


  return (
    <div className="py-8 h-full flex flex-col">
      <h1 className="text-3xl font-headline font-bold mb-8 text-center">AI Marketing Assistant</h1>
      <Card className="flex-1 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Chat with MiinBot</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-20rem)] pr-4" ref={scrollAreaRef}> {/* Adjust height as needed */}
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  {msg.sender === "ai" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md", msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                  </div>
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
                <p className="text-lg font-medium">Ask me anything about marketing!</p>
                <p className="text-sm">e.g., "How can I improve my email open rates?"</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your marketing question here..."
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || input.trim() === ""} className="h-full">
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
