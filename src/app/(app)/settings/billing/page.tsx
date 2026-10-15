"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, MessageSquareHeart, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FEEDBACK_EMAIL, FEEDBACK_MAILTO } from "@/lib/feedback";
import Link from "next/link";

export default function BillingPage() {
  const supportLink = "https://www.paypal.com/ncp/payment/TBFKX67S2G2K8";
  
  return (
    <div className="space-y-6">
         <Card>
          <CardHeader>
            <CardTitle>Support MiinPlanner</CardTitle>
            <CardDescription>
              MiinPlanner is free to use, built with passion. If you find it useful, please consider supporting its development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your support helps cover server costs and allows me to dedicate more time to adding new features and improving the app. Every contribution, no matter the size, is greatly appreciated!
            </p>
            <Button asChild className="w-full">
              <Link href={supportLink} target="_blank" rel="noopener noreferrer">
                <Coffee className="mr-2 h-4 w-4" />
                Buy me a coffee
              </Link>
            </Button>
          </CardContent>
        </Card>
        {/* Placeholder for optional paid extras. Not available yet, so it is shown greyed out and does nothing. */}
        <Card aria-disabled="true" className="opacity-50 select-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pro <Badge variant="secondary">Not available</Badge>
            </CardTitle>
            <CardDescription>
              Optional extras for people who want more. Everything you use today stays free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><Palette className="h-4 w-4" />Premium themes</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feedback and wishlist</CardTitle>
            <CardDescription>
              Found a bug, or wish MiinPlanner did something it doesn't? Email me and I'll read every message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href={FEEDBACK_MAILTO}>
                <MessageSquareHeart className="mr-2 h-4 w-4" />
                Email {FEEDBACK_EMAIL}
              </a>
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
