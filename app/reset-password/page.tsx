"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { StudentAuthShell } from "@/components/auth/student-auth-shell";

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

interface ResetState {
  status: "validating" | "valid" | "invalid" | "resetting" | "success" | "error";
  message: string;
  token: string | undefined;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;

  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [state, setState] = useState<ResetState>({
    status: token ? "valid" : "invalid",
    message: token ? "" : "Reset token is missing.",
    token,
  });

  const validateField = (name: string, value: string): string | undefined => {
    if (name === "password") {
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (value.length > 72) return "Password must be at most 72 characters";
    }
    if (name === "confirmPassword") {
      if (!value) return "Please confirm your password";
      if (value !== formData.password) return "Passwords do not match";
    }
    return undefined;
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

    if (!state.token) return;

    setState((prev) => ({ ...prev, status: "resetting", message: "Resetting password..." }));

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: data.error || "Failed to reset password.", token: state.token });
        return;
      }

      setState({ status: "success", message: data.message || "Your password has been reset successfully.", token: state.token });
    } catch {
      setState({ status: "error", message: "An unexpected error occurred. Please try again.", token: state.token });
    }
  };

  const renderIcon = () => {
    switch (state.status) {
      case "validating":
      case "resetting":
        return <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />;
      case "valid":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Lock className="h-8 w-8 text-primary-600" />
          </div>
        );
      case "success":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        );
      case "invalid":
      case "error":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (state.status) {
      case "validating":
        return (
          <>
            <CardTitle as="h1">Validating Reset Link</CardTitle>
            <CardDescription>Please wait while we verify your reset token.</CardDescription>
          </>
        );
      case "valid":
        return (
          <>
            <CardTitle as="h1">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </>
        );
      case "success":
        return (
          <>
            <CardTitle as="h1">Password Reset Successful</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        );
      case "invalid":
        return (
          <>
            <CardTitle as="h1">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </>
        );
      case "error":
        return (
          <>
            <CardTitle as="h1">Reset Failed</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        );
      case "resetting":
        return (
          <>
            <CardTitle as="h1">Resetting Password</CardTitle>
            <CardDescription>Please wait while we update your password.</CardDescription>
          </>
        );
    }
  };

  const renderForm = () => {
    if (state.status !== "valid") return null;

    return (
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {generalError && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Input
            label="New Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Use at least 8 characters"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={false}>
          Reset Password
        </Button>
      </form>
    );
  };

  const renderActions = () => {
    switch (state.status) {
      case "success":
        return (
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                Continue to Login <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        );
      case "invalid":
      case "error":
        return (
          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <StudentAuthShell>
    <Card className="auth-card">
      <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
        {renderIcon()}
        <div className="mt-4">{renderContent()}</div>
      </CardHeader>
      <CardContent className="px-6 pb-8 pt-0 sm:px-8">
        {renderForm()}
        {renderActions()}
      </CardContent>
    </Card>
    </StudentAuthShell>
  );
}
