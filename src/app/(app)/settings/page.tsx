
"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
        icon={Settings}
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">
                Select the color theme for the application.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  variant="outline"
                  className={cn(theme === "light" && "border-primary ring-2 ring-primary")}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  className={cn(theme === "dark" && "border-primary ring-2 ring-primary")}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  className={cn(theme === "system" && "border-primary ring-2 ring-primary")}
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
