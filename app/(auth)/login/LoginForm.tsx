"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Eye, EyeOff } from "lucide-react";
import { getSafeInternalPath } from "@/lib/auth/redirects";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeInternalPath(
    searchParams.get("callbackUrl"),
    "/student/dashboard"
  );

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
        return undefined;
      case "password":
        if (!value) return "Password is required";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    if (generalError) setGeneralError(null);
    if (emailNotVerified) setEmailNotVerified(false);
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setEmailNotVerified(true);
          setGeneralError(data.error);
        } else {
          setGeneralError(data.error || "Login failed. Please try again.");
        }
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setGeneralError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.error || "Failed to resend verification email.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&resent=true&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {generalError && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {emailNotVerified && (
        <Alert variant="default" className="mb-2 border-primary-200 bg-primary-50 text-primary-900">
          <AlertDescription className="flex items-center justify-between">
            <span>Your email is not verified. </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendVerification}
              disabled={isLoading}
            >
              Resend Verification
            </Button>
          </AlertDescription>
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

      <div className="relative">
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={isLoading}
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-600">Remember me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-primary-700 hover:text-primary-900"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary-950/10" size="lg" isLoading={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-primary-600 hover:text-primary-700">
          Register
        </Link>
      </p>
    </form>
  );
}