"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProfileAvatarUploader } from "@/components/student/profile-avatar-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { updateStudentProfileAction } from "@/lib/student/profile-actions";

export function ProfileEditForm({
  initial,
}: {
  initial: {
    name: string;
    phone: string;
    avatarUrl: string;
    address: string;
    education: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone,
    address: initial.address,
    education: initial.education,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="student-page-header">
        <h1 className="text-2xl font-bold text-slate-900">Edit profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep your learner information up to date.
        </p>
      </header>

      <Card className="rounded-2xl border-primary-100">
        <CardContent className="space-y-6 p-6">
          <ProfileAvatarUploader name={form.name} initialUrl={initial.avatarUrl} />

          {message ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>
          ) : null}

          <Text
            id="name"
            label="Full name"
            value={form.name}
            error={errors.name}
            onChange={(value) => update("name", value)}
          />
          <Text
            id="phone"
            label="Phone"
            value={form.phone}
            error={errors.phone}
            onChange={(value) => update("phone", value)}
          />
          <Area
            id="address"
            label="Address"
            value={form.address}
            error={errors.address}
            onChange={(value) => update("address", value)}
          />
          <Area
            id="education"
            label="Education information"
            value={form.education}
            error={errors.education}
            onChange={(value) => update("education", value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              isLoading={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateStudentProfileAction(form);
                  setErrors(result.fieldErrors ?? {});
                  setMessage(result.error ?? "");
                  if (result.ok) {
                    router.push("/student/profile");
                    router.refresh();
                  }
                })
              }
            >
              Save profile
            </Button>
            <Link
              href="/student/profile"
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700"
            >
              Cancel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Text({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClassName(Boolean(error), "h-10")}
      />
    </FieldShell>
  );
}

function Area({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClassName(Boolean(error), "min-h-24 py-2")}
      />
    </FieldShell>
  );
}
