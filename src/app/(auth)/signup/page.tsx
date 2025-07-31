
"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Chrome, CheckCircle } from "lucide-react";
import type { SignupFormData } from "@/types";
import { Logo } from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  const { signup, loginWithGoogle, loading, error, clearError, verificationEmailSent, setVerificationEmailSent } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({ email: "", password: "", confirmPassword: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
     if (error) clearError();
     if (verificationEmailSent) setVerificationEmailSent(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    const result = await signup({email: formData.email, password: formData.password});
    if (result) {
        setFormData({ email: "", password: "", confirmPassword: "" }); // Clear form on success
    }
  };

  const handleGoogleSignup = async () => {
    await loginWithGoogle();
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
          {verificationEmailSent ? (
             <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">Verification Email Sent!</AlertTitle>
                <AlertDescription>
                    A verification link has been sent to your email address. Please click the link to activate your account.
                </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Signup Failed</AlertTitle>
                    <AlertDescription>{error.message?.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '') || "An unexpected error occurred."}</AlertDescription>
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
                    minLength={6}
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
                    minLength={6}
                />
                </div>
                <Button type="submit" className="w-full" disabled={loading && formData.email !== "" && formData.password !== ""}>
                {loading && formData.email !== "" && formData.password !== "" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
            </form>
          )}

          {!verificationEmailSent && (
            <>
              <div className="my-6 flex items-center">
                <Separator className="flex-1" />
                <span className="mx-4 text-xs text-muted-foreground">OR SIGN UP WITH</span>
                <Separator className="flex-1" />
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
                {loading && !(formData.email !== "" && formData.password !== "") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />} 
                Sign Up with Google
              </Button>
            </>
          )}

        </CardContent>
        <CardFooter className="text-center block mt-6">
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
