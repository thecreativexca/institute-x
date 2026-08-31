"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafeInternalPath } from "@/lib/auth/redirects";

interface FormErrors {
  email?: string;
  password?: string;
}

export function OfficeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = getSafeInternalPath(searchParams.get("callbackUrl"), "/office");
  const callbackUrl = requestedPath.startsWith("/office") ? requestedPath : "/office";
  const passwordChanged = searchParams.get("passwordChanged") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!password) nextErrors.password = "Password is required";
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setGeneralError(null);
    try {
      const response = await fetch("/api/auth/office-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGeneralError(data.error || "Login failed. Please try again.");
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setGeneralError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {passwordChanged ? (
        <Alert variant="success">
          <AlertDescription>Your password was changed successfully. Sign in with your new password.</AlertDescription>
        </Alert>
      ) : null}
      {generalError ? (
        <Alert variant="destructive">
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      ) : null}

      <Input
        label="Work Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setErrors((current) => ({ ...current, email: undefined }));
          setGeneralError(null);
        }}
        error={errors.email}
        placeholder="name@institute.edu.in"
        autoComplete="email"
        icon={<Mail className="h-4 w-4" />}
        disabled={isLoading}
        required
      />

      <div className="relative">
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
            setGeneralError(null);
          }}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
          required
        />
        <button
          type="button"
          className="absolute right-3 top-[38px] text-slate-400 transition-colors hover:text-slate-700"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Remember me
        </label>
        <Link href="/office/forgot-password" className="text-sm font-medium text-primary-700 hover:text-primary-800">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg shadow-primary-950/10" isLoading={isLoading}>
        {isLoading ? "Signing in..." : "Sign In to Office Portal"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Student account?{" "}
        <Link href="/login" className="font-medium text-primary-700 hover:text-primary-800">
          Use student login
        </Link>
      </p>
    </form>
  );
}