"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";

interface OfficeAccount {
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  emailVerifiedAt?: string | null;
  lastOfficeLoginAt?: string | null;
  createdAt: string;
}

type Feedback = { type: "success" | "destructive"; title: string; message: string } | null;

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OfficeAccountClient({ account }: { account: OfficeAccount }) {
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const roleLabel = ROLE_LABELS[account.role as UserRole] ?? account.role;
  const initials = account.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileFeedback(null);

    if (!name.trim() || !email.trim()) {
      setProfileFeedback({ type: "destructive", title: "Check your details", message: "Name and email are required." });
      return;
    }

    setProfileSaving(true);
    try {
      const response = await fetch("/api/office/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok || !result.success) {
        setProfileFeedback({ type: "destructive", title: "Update failed", message: result.error ?? "Unable to update your profile." });
        return;
      }

      setProfileFeedback({ type: "success", title: "Profile updated", message: result.message ?? "Your account details were saved." });
      router.refresh();
    } catch {
      setProfileFeedback({ type: "destructive", title: "Update failed", message: "Please check your connection and try again." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "destructive", title: "Password too short", message: "Use at least 8 characters for the new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "destructive", title: "Passwords do not match", message: "Confirm the same new password in both fields." });
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/office/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok || !result.success) {
        setPasswordFeedback({ type: "destructive", title: "Password not changed", message: result.error ?? "Unable to change your password." });
        return;
      }

      setPasswordFeedback({ type: "success", title: "Password changed", message: result.message ?? "Please sign in again with your new password." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.push("/office/login?passwordChanged=1");
      }, 1200);
    } catch {
      setPasswordFeedback({ type: "destructive", title: "Password not changed", message: "Please check your connection and try again." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Personal workspace</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Account</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Keep your staff profile accurate and protect access to the Office Portal.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Secure staff account
        </span>
      </header>

      <Card className="overflow-hidden rounded-2xl border-primary-100">
        <CardContent className="relative p-0">
          <div className="office-grid-pattern absolute inset-0 opacity-45" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              {account.avatarUrl ? (
                // Avatar URLs can come from the institute's configured media provider.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={account.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-white/10" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-300 text-lg font-bold text-primary-950">{initials}</span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">{account.name}</h2>
                <p className="mt-1 truncate text-sm text-primary-100">{account.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="border-accent-200/30 bg-accent-200/15 text-accent-100">{roleLabel}</Badge>
                  <Badge className="border-white/15 bg-white/10 text-white">{account.status}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
              <div className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5">
                <p className="text-xs text-primary-200">Employee code</p>
                <p className="mt-0.5 font-semibold">{account.employeeCode || "Not assigned"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5">
                <p className="text-xs text-primary-200">Email status</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-semibold"><BadgeCheck className="h-4 w-4 text-accent-300" aria-hidden="true" /> {account.emailVerifiedAt ? "Verified" : "Not verified"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-primary-50/60">
            <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary-700" aria-hidden="true" /> Profile details</CardTitle>
            <CardDescription>Update the name and email used across your office workspace.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={updateProfile}>
              {profileFeedback ? (
                <Alert variant={profileFeedback.type} className="rounded-xl">
                  <div><AlertTitle>{profileFeedback.title}</AlertTitle><AlertDescription>{profileFeedback.message}</AlertDescription></div>
                </Alert>
              ) : null}
              <Input label="Full name" name="name" value={name} onChange={(event) => setName(event.target.value)} icon={<UserRound className="h-5 w-5" />} required autoComplete="name" />
              <Input label="Email address" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} icon={<Mail className="h-5 w-5" />} required autoComplete="email" />
              <Button type="submit" isLoading={profileSaving} className="rounded-xl">
                <Save className="h-4 w-4" aria-hidden="true" /> Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-gradient-to-r from-accent-50 to-primary-50">
            <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-accent-700" aria-hidden="true" /> Account information</CardTitle>
            <CardDescription>Employment details managed by the institute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {[
              { label: "Designation", value: account.designation || "Not set", icon: UserRound },
              { label: "Department", value: account.department || "Not set", icon: Building2 },
              { label: "Phone", value: account.phone || "Not set", icon: Phone },
              { label: "Member since", value: formatDate(account.createdAt), icon: CalendarDays },
              { label: "Last office login", value: formatDate(account.lastOfficeLoginAt), icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/35 p-3.5">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                <div className="min-w-0"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{item.value}</p></div>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-500">Contact your institute administrator to change employment information.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-primary-100">
        <div className="grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="bg-[#103a50] p-6 text-white sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-300 text-primary-950"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="mt-4 text-lg font-semibold">Password &amp; security</h2>
            <p className="mt-2 text-sm leading-6 text-primary-100">Choose a strong password you do not use elsewhere. Changing it signs this account out of existing sessions.</p>
          </div>
          <CardContent className="p-6 sm:p-7">
            <form className="space-y-5" onSubmit={changePassword}>
              {passwordFeedback ? (
                <Alert variant={passwordFeedback.type} className="rounded-xl">
                  <div><AlertTitle>{passwordFeedback.title}</AlertTitle><AlertDescription>{passwordFeedback.message}</AlertDescription></div>
                </Alert>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="Current password" name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} icon={<KeyRound className="h-5 w-5" />} required autoComplete="current-password" />
                <Input label="New password" name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} icon={<LockKeyhole className="h-5 w-5" />} required minLength={8} maxLength={72} autoComplete="new-password" />
                <Input label="Confirm password" name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} icon={<LockKeyhole className="h-5 w-5" />} required minLength={8} maxLength={72} autoComplete="new-password" />
              </div>
              <Button type="submit" isLoading={passwordSaving} className="rounded-xl">
                <KeyRound className="h-4 w-4" aria-hidden="true" /> Change password
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
