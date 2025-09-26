
"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Monitor, Sun, Moon, Palette, Leaf, Droplets, Sunrise, CheckCircle, Shield, Loader2, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { TaskSpacesManager } from "@/components/settings/TaskSpacesManager";
import { StatusManager } from "@/components/settings/StatusManager"; // Import the new component
import { taskSpaceTemplates } from "@/lib/task-space-templates";
import { useAppData } from "@/contexts/app-data-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TaskSpace } from "@/types";


const colorThemes = [
    { name: 'miin', label: 'Miin', icon: Palette },
    { name: 'forest', label: 'Forest', icon: Leaf },
    { name: 'ocean', label: 'Ocean', icon: Droplets },
    { name: 'sunset', label: 'Sunset', icon: Sunrise },
]

export default function SettingsPage() {
  const { theme: colorMode, setTheme: setColorMode } = useTheme(); // This is for light/dark/system
  const [colorTheme, setColorTheme] = React.useState('miin');
  const { userProfile, loading, updateUserPlan } = useAuth();
  const { toast } = useToast();
  const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { loadTaskSpaceTemplate } = useAppData();


  React.useEffect(() => {
    // Set initial color theme from localStorage or default
    const savedTheme = localStorage.getItem('color-theme') || 'miin';
    setColorTheme(savedTheme);
    document.documentElement.className = ''; // Clear existing classes
    document.documentElement.classList.add(colorMode ?? 'light', `theme-${savedTheme}`);
  }, [colorMode]);

  const handleSetColorTheme = (themeName: string) => {
    setColorTheme(themeName);
    localStorage.setItem('color-theme', themeName);
    
    // Get all theme classes
    const allThemes = colorThemes.map(t => `theme-${t.name}`);
    
    // Remove all theme classes first
    document.documentElement.classList.remove(...allThemes);
    
    // Add the new one
    document.documentElement.classList.add(`theme-${themeName}`);
  };

  const handlePlanChange = async (newPlan: 'free' | 'premium') => {
    setIsUpdatingPlan(true);
    try {
        await updateUserPlan(newPlan);
        toast({
            title: "Plan Updated!",
            description: `You are now on the ${newPlan} plan.`,
        });
    } catch (error) {
        console.error("Failed to update plan:", error);
        toast({
            title: "Error",
            description: "Could not update your plan. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsUpdatingPlan(false);
    }
  };
  
  const handleLoadTemplate = async (template: Omit<TaskSpace, 'id'>) => {
    setIsLoading(true);
    await loadTaskSpaceTemplate(template);
    setIsLoading(false);
  };


  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
        icon={Settings}
      />

      <div className="max-w-4xl mx-auto space-y-6">
         <Card>
          <CardHeader>
            <CardTitle>Plan & Billing</CardTitle>
            <CardDescription>
              Manage your subscription plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {loading && <Loader2 className="animate-spin" />}
             {!loading && userProfile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className={cn(userProfile.plan === 'free' ? "border-primary ring-2 ring-primary" : "")}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Free Plan</CardTitle>
                            <CardDescription>Basic features for individuals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Task Management</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Content Calendar</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Basic AI Insights</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {userProfile.plan === 'free' ? (
                                <Button disabled className="w-full">Current Plan</Button>
                            ) : (
                                <Button variant="outline" onClick={() => handlePlanChange('free')} disabled={isUpdatingPlan} className="w-full">
                                    {isUpdatingPlan ? <Loader2 className="animate-spin" /> : "Downgrade"}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                     <Card className={cn(userProfile.plan === 'premium' ? "border-primary ring-2 ring-primary" : "")}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield className="text-primary"/>Premium Plan</CardTitle>
                            <CardDescription>Advanced features for power users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Everything in Free</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Full AI Insights</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> AI Chatbot Assistant</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                             {userProfile.plan === 'premium' ? (
                                <Button disabled className="w-full">Current Plan</Button>
                            ) : (
                                <Button onClick={() => handlePlanChange('premium')} disabled={isUpdatingPlan} className="w-full">
                                    {isUpdatingPlan ? <Loader2 className="animate-spin" /> : "Upgrade"}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
             )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><Library />Template Library</CardTitle>
            <CardDescription>
                Get started quickly by loading a pre-built template. Loading a template will replace your current tasks and statuses.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskSpaceTemplates.map((template) => (
                <Card key={template.name} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
                <CardFooter>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Library className="h-4 w-4" />}
                        <span className="ml-2">Load</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Load Template: &quot;{template.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will replace all of your current tasks and custom statuses. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleLoadTemplate(template)}>Load Template</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
                </Card>
            ))}
            </CardContent>
        </Card>

        <TaskSpacesManager />

        <StatusManager />

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application. Changes are saved automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <p className="text-sm text-muted-foreground">
                Select the color mode for the application.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  variant="outline"
                  className={cn(colorMode === "light" && "border-primary ring-2 ring-primary")}
                  onClick={() => setColorMode("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  className={cn(colorMode === "dark" && "border-primary ring-2 ring-primary")}
                  onClick={() => setColorMode("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  className={cn(colorMode === "system" && "border-primary ring-2 ring-primary")}
                  onClick={() => setColorMode("system")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color Palette</label>
               <p className="text-sm text-muted-foreground">
                Select the primary color palette for the interface.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {colorThemes.map((cTheme) => {
                  const Icon = cTheme.icon;
                  return (
                    <Button
                      key={cTheme.name}
                      variant="outline"
                      className={cn(
                        "justify-start h-12",
                        colorTheme === cTheme.name && "border-primary ring-2 ring-primary"
                      )}
                      onClick={() => handleSetColorTheme(cTheme.name)}
                    >
                      <span className="flex items-center justify-center rounded-full mr-3 w-6 h-6">
                          <Icon className="h-5 w-5" />
                      </span>
                      {cTheme.label}
                    </Button>
                  );
                })}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
