
"use client";

import { useEffect } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { Task, SocialMediaPost } from "@/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function CalendarPage() {
  const { 
    tasks, 
    fetchTasks, 
    socialMediaPosts, 
    fetchSocialMediaPosts, 
    isLoadingTasks, 
    isLoadingSocialMediaPosts 
  } = useAppData();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    fetchTasks();
    fetchSocialMediaPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleTaskClick = (task: Task) => {
    console.log("Task clicked:", task);
    // For now, show a toast. Later, this could open a detail modal.
    toast({
      title: `Task: ${task.title}`,
      description: `Priority: ${task.priority}, Due: ${task.dueDate ? format(parseISO(task.dueDate), "MMM dd, yyyy") : "N/A"}`,
    });
  };

  const handlePostClick = (post: SocialMediaPost) => {
    console.log("Post clicked:", post);
    // For now, show a toast. Later, this could navigate or open a modal.
    toast({
      title: `Post for ${post.platform}`,
      description: `Status: ${post.status}, Content: ${post.content.substring(0,30)}...`,
    });
  };

  const isLoading = isLoadingTasks || isLoadingSocialMediaPosts;

  if (isLoading && tasks.length === 0 && socialMediaPosts.length === 0) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8">Content Calendar</h1>
      <CalendarView 
        tasks={tasks} 
        posts={socialMediaPosts}
        onTaskClick={handleTaskClick}
        onPostClick={handlePostClick}
      />
    </div>
  );
}

// Helper function to parse ISO date strings (needed for toast display)
import { parseISO, format } from "date-fns";

    