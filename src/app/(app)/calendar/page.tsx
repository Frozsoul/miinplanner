
"use client";

import { useEffect, useMemo } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { Task, SocialMediaPost } from "@/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; 
import { parseISO, format, isValid } from "date-fns";
import { DashboardAIInsight } from "@/components/dashboard/DashboardAIInsight";

export default function CalendarPage() {
  const { 
    tasks, 
    fetchTasks, 
    socialMediaPosts, 
    fetchSocialMediaPosts, 
    isLoadingTasks, 
    isLoadingSocialMediaPosts 
  } = useAppData();
  const { toast } = useToast(); 

  useEffect(() => {
    fetchTasks();
    fetchSocialMediaPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const activeTasks = useMemo(() => tasks.filter(task => !task.archived), [tasks]);

  const handleTaskClick = (task: Task) => {
    console.log("Task clicked:", task);
    const dueDate = task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), "MMM dd, yyyy") : "N/A";
    toast({
      title: `Task: ${task.title}`,
      description: `Priority: ${task.priority}, Due: ${dueDate}`,
    });
  };

  const handlePostClick = (post: SocialMediaPost) => {
    console.log("Post clicked:", post);
    toast({
      title: `Post for ${post.platform}`,
      description: `Status: ${post.status}, Content: ${post.content.substring(0,30)}...`,
    });
  };

  const isLoading = isLoadingTasks || isLoadingSocialMediaPosts;

  if (isLoading && tasks.length === 0 && socialMediaPosts.length === 0) {
    return (
      <div className="px-4 sm:px-6 md:py-6 flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:py-6">
      <h1 className="text-3xl font-headline font-bold mb-8">Content Calendar</h1>
      <div className="mb-6">
        <DashboardAIInsight />
      </div>
      <CalendarView 
        tasks={activeTasks} 
        posts={socialMediaPosts}
        onTaskClick={handleTaskClick}
        onPostClick={handlePostClick}
      />
    </div>
  );
}
