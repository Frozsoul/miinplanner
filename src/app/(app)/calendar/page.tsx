
"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateContentIdeas, type GenerateContentIdeasInput } from "@/ai/flows/generate-content-ideas";
import type { ContentIdea } from "@/types";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiInput, setAiInput] = useState<GenerateContentIdeasInput>({
    keywords: "",
    tone: "informative",
    targetAudience: "",
    numberOfIdeas: 3,
  });

  const handleGenerateIdeas = async () => {
    setIsLoading(true);
    try {
      const result = await generateContentIdeas(aiInput);
      setContentIdeas(result.ideas.map((ideaText, index) => ({
        id: Date.now().toString() + index,
        text: ideaText,
        keywords: aiInput.keywords,
        tone: aiInput.tone,
        targetAudience: aiInput.targetAudience,
      })));
    } catch (error) {
      console.error("Failed to generate content ideas:", error);
      // TODO: Show error toast to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8">Content Calendar</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Schedule</CardTitle>
              <CardDescription>Plan and visualize your content publication dates.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Select a date to see planned content (feature coming soon).</p>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="text-accent" /> AI Content Ideas</CardTitle>
              <CardDescription>Generate fresh content ideas based on your preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" value={aiInput.keywords} onChange={(e) => setAiInput({ ...aiInput, keywords: e.target.value })} placeholder="e.g., social media, SEO, email marketing" />
              </div>
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Input id="tone" value={aiInput.tone} onChange={(e) => setAiInput({ ...aiInput, tone: e.target.value })} placeholder="e.g., informative, humorous, professional" />
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea id="targetAudience" value={aiInput.targetAudience} onChange={(e) => setAiInput({ ...aiInput, targetAudience: e.target.value })} placeholder="e.g., small business owners, marketing professionals" />
              </div>
              <div>
                <Label htmlFor="numberOfIdeas">Number of Ideas</Label>
                <Input id="numberOfIdeas" type="number" value={aiInput.numberOfIdeas} onChange={(e) => setAiInput({ ...aiInput, numberOfIdeas: parseInt(e.target.value) || 3 })} min="1" max="10" />
              </div>
              <Button onClick={handleGenerateIdeas} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Ideas
              </Button>
            </CardContent>
            {contentIdeas.length > 0 && (
              <CardFooter className="flex flex-col items-start pt-4 border-t">
                <h3 className="text-md font-semibold mb-2">Generated Ideas:</h3>
                <ScrollArea className="h-[200px] w-full">
                  <ul className="space-y-2 list-disc list-inside">
                    {contentIdeas.map((idea) => (
                      <li key={idea.id} className="text-sm">{idea.text}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
