
"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Monitor, Sun, Moon, Palette, Leaf, Droplets, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import useLocalStorage from "@/hooks/use-local-storage";

const colorThemes = [
    { name: 'miin', label: 'Miin', icon: Palette },
    { name: 'forest', label: 'Forest', icon: Leaf },
    { name: 'ocean', label: 'Ocean', icon: Droplets },
    { name: 'sunset', label: 'Sunset', icon: Sunrise },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useLocalStorage('color-theme', 'miin');

  React.useEffect(() => {
    document.documentElement.classList.remove('theme-miin', 'theme-forest', 'theme-ocean', 'theme-sunset');
    document.documentElement.classList.add(`theme-${colorTheme}`);
  }, [colorTheme]);

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
                      onClick={() => setColorTheme(cTheme.name)}
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
