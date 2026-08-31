"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Eye, EyeOff, Lock, XCircle } from "lucide-react";

import { OfficeAuthShell } from "@/components/office/office-auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function OfficeResetPasswordPage() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > 72) {
      setError("Password must be at most 72 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/office-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to reset the password.");
        return;
      }
      setIsComplete(true);
    } catch {
      setError("Unable to reset the password right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isInvalid = !token;

  return (
    <OfficeAuthShell>
      <Card className="office-auth-card rounded-3xl">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isComplete ? "bg-emerald-100 text-emerald-700" : isInvalid ? "bg-red-100 text-red-700" : "bg-accent-100 text-accent-800"}`}>
            {isComplete ? <CheckCircle className="h-6 w-6" /> : isInvalid ? <XCircle className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </span>
          <CardTitle as="h1" className="mt-3">
            {isComplete ? "Password Reset Complete" : isInvalid ? "Invalid Reset Link" : "Choose a New Password"}
          </CardTitle>
          <CardDescription>
            {isComplete
              ? "Your office password has been updated. Sign in again to continue."
              : isInvalid
                ? "This reset link is incomplete. Request a new link to continue."
                : "Use a strong password between 8 and 72 characters."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          {isComplete ? (
            <Button asChild size="lg" className="w-full">
              <Link href="/office/login">Continue to Office Login</Link>
            </Button>
          ) : isInvalid ? (
            <div className="space-y-3">
              <Button asChild size="lg" className="w-full">
                <Link href="/office/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/office/login">Back to Office Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Input
                label="New Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                placeholder="Enter a new password"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError(null);
                  }}
                  placeholder="Confirm the new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-slate-400 transition-colors hover:text-slate-700"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg shadow-primary-950/10" isLoading={isLoading}>
                {isLoading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </OfficeAuthShell>
  );
}
