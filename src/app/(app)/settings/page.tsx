
"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Monitor, Sun, Moon, Palette, Leaf, Droplets, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

const colorThemes = [
    { name: 'miin', label: 'Miin', icon: Palette, lightColor: "bg-yellow-400", darkColor: "bg-yellow-400" },
    { name: 'forest', label: 'Forest', icon: Leaf, lightColor: "bg-green-500", darkColor: "bg-teal-500" },
    { name: 'ocean', label: 'Ocean', icon: Droplets, lightColor: "bg-blue-500", darkColor: "bg-blue-500" },
    { name: 'sunset', label: 'Sunset', icon: Sunrise, lightColor: "bg-orange-500", darkColor: "bg-amber-500" },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mode, color] = theme?.split("-") || ["light", "miin"];

  const handleModeChange = (newMode: string) => {
    setTheme(`${newMode}-${color}`);
  };
  
  const handleColorChange = (newColor: string) => {
    setTheme(`${mode}-${newColor}`);
  }

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
        icon={Settings}
      />

      <div className="max-w-2xl mx-auto space-y-6">
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
                  className={cn(mode === "light" && "border-primary ring-2 ring-primary")}
                  onClick={() => handleModeChange("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  className={cn(mode === "dark" && "border-primary ring-2 ring-primary")}
                  onClick={() => handleModeChange("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  className={cn(mode === "system" && "border-primary ring-2 ring-primary")}
                  onClick={() => handleModeChange("system")}
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
                        color === cTheme.name && "border-primary ring-2 ring-primary"
                      )}
                      onClick={() => handleColorChange(cTheme.name)}
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
