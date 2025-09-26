
"use client";
import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddTask } from "@/components/dashboard/QuickAddTask";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CheckCircle, Clock, Users, BarChart3, CalendarClock, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { useEffect } from "react";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { TaskSpacesSection } from "@/components/dashboard/TaskSpacesSection";


const LayoutDashboardIcon = BarChart3;

export default function DashboardPage() {
  const { 
    tasks, 
    fetchTasks, 
    isLoadingTasks,
  } = useAppData();

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTasks = tasks.filter(task => !task.archived);
  
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

  if (isLoadingTasks) {
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
        description={<MotivationalQuote context="dashboard" />}
        icon={LayoutDashboardIcon}
        actionButtons={<QuickAddTask />} 
      />
      
      <TaskSpacesSection />

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
    </div>
  );
}
