"use client";
import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddTask } from "@/components/dashboard/QuickAddTask";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, AlertTriangle, BarChart3, CalendarClock, Send, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid, isPast } from "date-fns";
import { useEffect, useMemo } from "react";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { TaskSpacesSection } from "@/components/dashboard/TaskSpacesSection";
import { NewUserDashboard } from "@/components/dashboard/NewUserDashboard";


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

  const activeTasks = useMemo(() => tasks.filter(task => !task.archived), [tasks]);
  
  const upcomingTasks = useMemo(() => activeTasks
    .filter(task => {
        if (!task.dueDate) return false;
        try {
            const dueDate = parseISO(task.dueDate);
            return isValid(dueDate) && !isPast(dueDate) && task.status !== 'Done';
        } catch { return false; }
    })
    .sort((a, b) => (parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime()))
    .slice(0, 5), [activeTasks]);
    
  const overdueTasks = useMemo(() => activeTasks
    .filter(task => {
        if (!task.dueDate) return false;
        try {
            const dueDate = parseISO(task.dueDate);
            return isValid(dueDate) && isPast(dueDate) && task.status !== 'Done';
        } catch { return false; }
    })
    .sort((a, b) => (parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime()))
    .slice(0, 5), [activeTasks]);
    
  const tasksToShow = upcomingTasks.length > 0 ? upcomingTasks : overdueTasks;
  const isShowingOverdue = upcomingTasks.length === 0 && overdueTasks.length > 0;

  if (isLoadingTasks && tasks.length === 0) {
    return (
      <div className="px-4 sm:px-6 md:py-6 flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoadingTasks && tasks.length === 0) {
    return <NewUserDashboard />;
  }


  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader 
        title="Dashboard" 
        description={<MotivationalQuote context="dashboard" />}
        icon={LayoutDashboardIcon}
        actionButtons={<QuickAddTask />} 
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isShowingOverdue ? <AlertTriangle className="h-5 w-5 text-destructive"/> : <CalendarClock className="h-5 w-5 text-primary"/>}
            {isShowingOverdue ? "Overdue Tasks" : "Upcoming Deadlines"}
          </CardTitle>
          <CardDescription>
            {isShowingOverdue ? "These tasks have passed their due date." : "Tasks that are due soon."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksToShow.length > 0 ? (
            <ul className="space-y-3">
              {tasksToShow.map(task => (
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
            <p className="text-muted-foreground">No upcoming or overdue tasks. Great job!</p>
          )}
        </CardContent>
      </Card>
      
      <TaskSpacesSection />
    </div>
  );
}
