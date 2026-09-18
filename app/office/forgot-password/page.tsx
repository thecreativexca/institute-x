"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";

import { OfficeAuthShell } from "@/components/office/office-auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function OfficeForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/office-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to send OTP. Please try again.");
        return;
      }
      setSentEmail(normalizedEmail);
      setDevOtp(typeof data.devOtp === "string" ? data.devOtp : null);
      setOtp("");
      setStep("otp");
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP sent to your email.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/office-verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sentEmail, otp }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.token !== "string") {
        setError(data.error || "OTP verification failed.");
        return;
      }
      router.push(`/office/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OfficeAuthShell>
      <Card className="office-auth-card rounded-3xl">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">{step === "email" ? <Mail className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}</span>
          <CardTitle as="h1" className="mt-3">{step === "email" ? "Reset Office Password" : "Enter Email OTP"}</CardTitle>
          <CardDescription>{step === "email" ? "Enter your work email and we will send a 6-digit OTP." : <>Enter the OTP sent to <strong>{sentEmail}</strong>. It expires in 10 minutes.</>}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          <form onSubmit={(event) => { event.preventDefault(); void (step === "email" ? requestOtp() : verifyOtp()); }} className="space-y-4" noValidate>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            {devOtp ? <Alert><AlertDescription>Development OTP: <strong>{devOtp}</strong></AlertDescription></Alert> : null}
            {step === "email" ? (
              <Input label="Work Email" name="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(null); }} placeholder="name@institute.edu.in" autoComplete="email" icon={<Mail className="h-4 w-4" />} disabled={isLoading} required />
            ) : (
              <Input label="6-digit OTP" name="otp" type="text" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }} placeholder="000000" autoComplete="one-time-code" inputMode="numeric" maxLength={6} disabled={isLoading} required />
            )}
            <Button type="submit" size="lg" className="w-full rounded-xl" isLoading={isLoading}>{step === "email" ? "Send OTP" : "Verify OTP"}</Button>
            {step === "otp" ? (
              <div className="flex justify-between gap-3 text-sm">
                <button type="button" className="font-medium text-primary-700 hover:text-primary-800" onClick={() => { setStep("email"); setDevOtp(null); setError(null); }}>Change email</button>
                <button type="button" className="font-medium text-primary-700 hover:text-primary-800" disabled={isLoading} onClick={() => void requestOtp()}>Resend OTP</button>
              </div>
            ) : (
              <Link href="/office/login" className="flex items-center justify-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"><ArrowLeft className="h-4 w-4" /> Back to Office Login</Link>
            )}
          </form>
        </CardContent>
      </Card>
    </OfficeAuthShell>
  );
}
