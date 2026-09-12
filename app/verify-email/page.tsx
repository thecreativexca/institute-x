"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { getSafeInternalPath } from "@/lib/auth/redirects";
import { StudentAuthShell } from "@/components/auth/student-auth-shell";

interface VerifyEmailState {
  status: "verifying" | "success" | "error" | "pending";
  message: string;
  email?: string;
  callbackUrl?: string;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const callbackUrl = getSafeInternalPath(
    searchParams.get("callbackUrl"),
    "/student/dashboard"
  );
  const resent = searchParams.get("resent") === "true";

  const [state, setState] = useState<VerifyEmailState>(() => {
    if (!token && emailParam) {
      return {
        status: "pending" as const,
        message: resent
          ? "A new verification email has been sent. Please check your inbox."
          : "Please check your email and click the verification link to activate your account.",
        email: emailParam,
        callbackUrl,
      };
    }
    return { status: token ? ("verifying" as const) : ("pending" as const), message: "" };
  });

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setState({
            status: "success",
            message: data.message || "Email verified successfully. You can now log in.",
            callbackUrl,
          });
        } else {
          setState({
            status: "error",
            message: data.error || "Invalid or expired verification token.",
            callbackUrl,
          });
        }
      } catch {
        setState({
          status: "error",
          message: "An unexpected error occurred. Please try again.",
          callbackUrl,
        });
      }
    };

    verifyEmail();
  }, [token, emailParam, resent, callbackUrl]);

  const handleResendVerification = async () => {
    if (!state.email) return;

    setState((prev) => ({ ...prev, status: "verifying", message: "Sending verification email..." }));

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(state.email)}&resent=true&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        setState((prev) => ({
          ...prev,
          status: "error",
          message: data.error || "Failed to resend verification email.",
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        message: "An unexpected error occurred. Please try again.",
      }));
    }
  };

  const renderIcon = () => {
    switch (state.status) {
      case "verifying":
        return <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />;
      case "success":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle className="h-8 w-8 text-amber-700" />
          </div>
        );
      case "error":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100">
            <Mail className="h-8 w-8 text-accent-800" />
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (state.status) {
      case "verifying":
        return (
          <>
            <CardTitle as="h1">Verifying Your Email</CardTitle>
            <CardDescription>Please wait while we verify your email address.</CardDescription>
          </>
        );
      case "success":
        return (
          <>
            <CardTitle as="h1">Email Verified Successfully</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        );
      case "error":
        return (
          <>
            <CardTitle as="h1">Verification Failed</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        );
      default:
        return (
          <>
            <CardTitle as="h1">Check Your Email</CardTitle>
            <CardDescription>
              {state.message}
              {state.email && (
                <span className="mt-2 block text-sm text-slate-600">
                  Sent to <strong className="text-slate-900">{state.email}</strong>
                </span>
              )}
            </CardDescription>
          </>
        );
    }
  };

  const renderActions = () => {
    switch (state.status) {
      case "success":
        return (
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  state.callbackUrl || "/student/dashboard"
                )}`}
              >
                Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
            {state.email && (
              <Button variant="secondary" onClick={handleResendVerification} className="w-full">
                Resend Verification Email
              </Button>
            )}
          </div>
        );
      case "pending":
        return (
          <div className="flex flex-col gap-3">
            <Button variant="secondary" onClick={handleResendVerification} className="w-full" disabled={!state.email}>
              Resend Verification Email
            </Button>
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              Back to Login
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
      <CardContent className="px-6 pb-8 pt-0 sm:px-8">{renderActions()}</CardContent>
    </Card>
    </StudentAuthShell>
  );
}
