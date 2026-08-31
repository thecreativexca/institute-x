"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

import { OfficeAuthShell } from "@/components/office/office-auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function OfficeForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid work email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/office-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to send the reset link.");
        return;
      }
      setIsComplete(true);
    } catch {
      setError("Unable to send the reset link right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OfficeAuthShell>
      <Card className="office-auth-card rounded-3xl">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-accent-100 text-accent-800"}`}>
            {isComplete ? <CheckCircle className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </span>
          <CardTitle as="h1" className="mt-3">
            {isComplete ? "Check Your Email" : "Reset Office Password"}
          </CardTitle>
          <CardDescription>
            {isComplete
              ? "If an active staff account exists for this email, a secure reset link has been sent."
              : "Enter your work email and we will send you a secure password reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          {isComplete ? (
            <Button asChild size="lg" className="w-full">
              <Link href="/office/login">Return to Office Login</Link>
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Input
                label="Work Email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder="name@institute.edu.in"
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
                error={error ?? undefined}
                disabled={isLoading}
                required
              />
              <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg shadow-primary-950/10" isLoading={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/office/login" className="flex items-center justify-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Office Login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </OfficeAuthShell>
  );
}
