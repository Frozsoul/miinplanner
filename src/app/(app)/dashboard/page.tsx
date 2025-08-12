
"use client";
import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddTask } from "@/components/dashboard/QuickAddTask";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CheckCircle, Clock, Users, BarChart3, CalendarClock, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { useEffect } from "react";
import { DashboardAIInsight } from "@/components/dashboard/DashboardAIInsight";


const LayoutDashboardIcon = BarChart3;

export default function DashboardPage() {
  const { 
    tasks, 
    socialMediaPosts, 
    fetchTasks, 
    fetchSocialMediaPosts,
    isLoadingTasks,
    isLoadingSocialMediaPosts
  } = useAppData();

  useEffect(() => {
    fetchTasks();
    fetchSocialMediaPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTasks = tasks.filter(task => !task.archived);
  const tasksToDo = activeTasks.filter(task => task.status === 'To Do').length;
  const tasksInProgress = activeTasks.filter(task => task.status === 'In Progress').length;
  const tasksDone = activeTasks.filter(task => task.status === 'Done').length;
  
  const upcomingTasks = activeTasks
    .filter(task => {
        if (!task.dueDate) return false;
        try {
            const dueDate = parseISO(task.dueDate);
            return isValid(dueDate) && dueDate >= new Date() && task.status !== 'Done';
        } catch {
            return false;
        }
    })
    .sort((a, b) => {
        const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
        return dateA - dateB;
    })
    .slice(0, 5);

  const scheduledPosts = socialMediaPosts
    .filter(post => {
        if (!post.scheduledDate) return false;
        try {
            const scheduledDate = parseISO(post.scheduledDate);
            return isValid(scheduledDate) && scheduledDate >= new Date() && post.status === 'Scheduled';
        } catch {
            return false;
        }
    })
    .sort((a,b) => {
        const dateA = a.scheduledDate ? parseISO(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? parseISO(b.scheduledDate).getTime() : 0;
        return dateA - dateB;
    })
    .slice(0,5);

  if (isLoadingTasks || isLoadingSocialMediaPosts) {
    return (
      <div className="px-4 sm:px-6 md:py-6 flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back! Here's an overview of your MiinPlanner workspace."
        icon={LayoutDashboardIcon}
        actionButtons={<QuickAddTask />} 
      />

      <DashboardAIInsight />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Tasks" value={activeTasks.length} icon={ListChecks} description="All non-archived tasks" />
        <SummaryCard title="Tasks To Do" value={tasksToDo} icon={Clock} description="Pending tasks" className="bg-destructive/80 text-destructive-foreground" />
        <SummaryCard title="In Progress" value={tasksInProgress} icon={Users} description="Currently active tasks" className="bg-accent/80 text-accent-foreground" />
        <SummaryCard title="Completed" value={tasksDone} icon={CheckCircle} description="Finished active tasks" className="bg-primary/90 text-primary-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks that are due soon.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <ul className="space-y-3">
                {upcomingTasks.map(task => (
                  <li key={task.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div>
                      <Link href={`/tasks#${task.id}`} className="font-medium hover:underline">{task.title}</Link>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), "MMM dd, yyyy") : "N/A"} - Priority: {task.priority}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild><Link href={`/tasks#${task.id}`}>View</Link></Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming deadlines. Great job!</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Scheduled Posts</CardTitle>
            <CardDescription>Content ready to go live.</CardDescription>
          </CardHeader>
          <CardContent>
             {scheduledPosts.length > 0 ? (
              <ul className="space-y-3">
                {scheduledPosts.map(post => (
                  <li key={post.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{post.platform}: {post.content.substring(0,50)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {post.scheduledDate && isValid(parseISO(post.scheduledDate)) ? format(parseISO(post.scheduledDate), "MMM dd, yyyy HH:mm") : "N/A"}
                      </p>
                    </div>
                     <Button variant="outline" size="sm" asChild><Link href={`/content#${post.id}`}>View</Link></Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No posts scheduled for the near future.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    