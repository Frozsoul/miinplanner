
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
  const { userProfile, loading, updateUserPlan } = useAuth();
  const { toast } = useToast();
  const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false);

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
  
  return (
    <div className="space-y-6">
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
    </div>
  );
}

