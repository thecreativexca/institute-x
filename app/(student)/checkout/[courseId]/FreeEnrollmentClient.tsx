"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Gift } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FreeEnrollmentClientProps {
  course: {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
  };
}

export function FreeEnrollmentClient({ course }: FreeEnrollmentClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnrollment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/enrollments/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to complete enrollment.");
        return;
      }
      router.replace(`/student/courses/${course.id}`);
      router.refresh();
    } catch {
      setError("Unable to complete enrollment right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <Gift className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-amber-800">Free course</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Enroll in {course.name}</h1>
          {course.shortDescription ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{course.shortDescription}</p>
          ) : null}
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            No payment is required
          </div>
          {error ? (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="mt-6 space-y-3">
            <Button onClick={handleEnrollment} size="lg" className="w-full" isLoading={isLoading}>
              {isLoading ? "Enrolling..." : "Confirm Free Enrollment"}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/courses/${course.slug}`}>Back to Course</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
