
"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SignupFormData } from "@/types";
import { Logo } from "@/components/common/logo";

export default function SignupPage() {
  const { signup, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({ email: "", password: "", confirmPassword: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
     if (error) clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      // This basic error handling could be improved with a toast or inline message
      alert("Passwords do not match.");
      return;
    }
    await signup({email: formData.email, password: formData.password});
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <Logo className="mb-8 h-10" />
      <Card className="w-full max-w-md border-0 shadow-none md:border md:shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join MiinPlanner today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Signup Failed</AlertTitle>
                <AlertDescription>{error.message || "An unexpected error occurred."}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
             <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/login">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
