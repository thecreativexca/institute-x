"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { StudentAuthShell } from "@/components/auth/student-auth-shell";

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<FormData>({ email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState<string>("");

  const validateField = (name: string, value: string): string | undefined => {
    if (name === "email") {
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const error = validateField("email", formData.email);
    if (error) {
      setErrors({ email: error });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.error || "Failed to send reset email. Please try again.");
        return;
      }

      setSuccess(true);
      setSentEmail(formData.email);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <StudentAuthShell>
      <Card className="auth-card">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle as="h1">Check Your Email</CardTitle>
          <CardDescription>
            If an account exists with <strong>{sentEmail}</strong>, a password reset link has been sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 pb-8 sm:px-8">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
      </StudentAuthShell>
    );
  }

  return (
    <StudentAuthShell>
    <Card className="auth-card">
      <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle as="h1">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {generalError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isLoading}
            icon={<Mail className="h-4 w-4 text-slate-400" />}
          />

          <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary-950/10" size="lg" isLoading={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
    </StudentAuthShell>
  );
}
