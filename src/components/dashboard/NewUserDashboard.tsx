"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { MotivationalQuote } from "./MotivationalQuote";

export function NewUserDashboard() {
  return (
    <div className="px-4 sm:px-6 md:py-6 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center">
        <Card className="max-w-xl shadow-lg border-primary/20">
            <CardContent className="p-8 space-y-4">
                <Sparkles className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-headline font-bold">Welcome to MiinPlanner!</h1>
                <p className="text-muted-foreground">
                    This is your dashboard, your mission control for productivity. 
                    It looks like you're just getting started. The first step to conquering your goals is to define them.
                </p>
                <div className="py-2">
                    <MotivationalQuote context="dashboard" />
                </div>
                <Button size="lg" asChild>
                    <Link href="/tasks">Create Your First Task <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
