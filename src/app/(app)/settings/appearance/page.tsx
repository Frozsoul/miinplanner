
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Sun, Moon, Palette, Leaf, Droplets, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

const colorThemes = [
    { name: 'miin', label: 'Miin', icon: Palette },
    { name: 'forest', label: 'Forest', icon: Leaf },
    { name: 'ocean', label: 'Ocean', icon: Droplets },
    { name: 'sunset', label: 'Sunset', icon: Sunrise },
]

export default function AppearancePage() {
  const { theme: colorMode, setTheme: setColorMode } = useTheme(); // This is for light/dark/system
  const [colorTheme, setColorTheme] = React.useState('miin');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') || 'miin';
    setColorTheme(savedTheme);
    document.documentElement.className = ''; // Clear existing classes
    document.documentElement.classList.add(colorMode ?? 'light', `theme-${savedTheme}`);
  }, [colorMode]);

  const handleSetColorTheme = (themeName: string) => {
    setColorTheme(themeName);
    localStorage.setItem('color-theme', themeName);
    
    const allThemes = colorThemes.map(t => `theme-${t.name}`);
    document.documentElement.classList.remove(...allThemes);
    document.documentElement.classList.add(`theme-${themeName}`);
  };

  return (
    <div className="space-y-6">
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
  );
}

