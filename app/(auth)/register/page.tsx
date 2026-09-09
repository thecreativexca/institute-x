"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, Phone } from "lucide-react";
import { getSafeInternalPath } from "@/lib/auth/redirects";
import { siteConfig } from "@/lib/config/site";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeInternalPath(
    searchParams.get("callbackUrl"),
    "/student/dashboard"
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (value.trim().length > 120) return "Name must be at most 120 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
        return undefined;
      case "phone":
        if (value && !/^(\+91)?[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ""))) {
          return "Enter a valid Indian mobile number";
        }
        return undefined;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (value.length > 72) return "Password must be at most 72 characters";
        return undefined;
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    if (name === "password" && nextFormData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          nextFormData.confirmPassword === value
            ? undefined
            : "Passwords do not match",
      }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.issues) {
          const fieldErrors: FormErrors = {};
          Object.entries(data.issues).forEach(([key, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[key as keyof FormErrors] = messages[0] as string;
            }
          });
          setErrors(fieldErrors);
        } else {
          setGeneralError(data.error || "Registration failed. Please try again.");
        }
        return;
      }

      setSuccess(true);
      const redirectUrl = (data as { redirect?: string }).redirect;
      setTimeout(() => {
        // Registration auto-verifies and logs the student in, so go straight to
        // the dashboard (no separate "verify your email" step).
        router.push(redirectUrl ?? `/login?registered=1`);
      }, 1200);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="auth-card">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <CardTitle as="h1">Account Created</CardTitle>
          <CardDescription>Taking you to your dashboard...</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="auth-card">
      <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
          <User className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle as="h1">Create Your Student Account</CardTitle>
        <CardDescription>
          Join {siteConfig.name} to access courses and track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {generalError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              disabled={isLoading}
              icon={<User className="h-4 w-4 text-slate-400" />}
            />
            <Input
              label="Mobile Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              icon={<Phone className="h-4 w-4 text-slate-400" />}
            />
          </div>

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

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Use at least 8 characters"
              autoComplete="new-password"
              required
              disabled={isLoading}
              icon={<Lock className="h-4 w-4 text-slate-400" />}
            />
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
            disabled={isLoading}
            icon={<Lock className="h-4 w-4 text-slate-400" />}
          />

          <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary-950/10" size="lg" isLoading={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-primary-600 hover:text-primary-700">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
