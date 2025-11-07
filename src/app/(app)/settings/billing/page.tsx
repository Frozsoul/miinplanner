
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const supportLink = "https://www.paypal.com/paypalme/miindigital";
  
  return (
    <div className="space-y-6">
         <Card>
          <CardHeader>
            <CardTitle>Support MiinPlanner</CardTitle>
            <CardDescription>
              MiinPlanner is a free tool, built with passion. If you find it useful, please consider supporting its development.
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
    </div>
  );
}
