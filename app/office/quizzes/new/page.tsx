import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CreateQuizForm } from "@/components/office/quizzes/CreateQuizForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Quiz — Office Portal",
  description: "Create a new quiz or test for your course.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CreateQuizPage() {
  const { user } = await getValidatedSession();

  if (!user) {
    redirect("/login?callbackUrl=/office/quizzes/new");
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the quiz management portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to create quizzes.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const courses = await Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean();
  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="max-w-3xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/office/quizzes">
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">Create Quiz</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Create a new quiz, module test, or final exam. Configure settings and add questions.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Fill in the quiz details below. You can save as draft and publish later after adding questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateQuizForm courseOptions={courseOptions} />
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
