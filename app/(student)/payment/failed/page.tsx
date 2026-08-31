import { Metadata } from "next";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { FailureClient } from "./FailureClient";

interface FailedPageProps {
  searchParams: Promise<{ courseId?: string; error?: string }>;
}

export const metadata: Metadata = {
  title: "Payment Failed",
  description: "Your payment could not be completed",
  robots: { index: false, follow: false },
};

export default async function FailedPage({ searchParams }: FailedPageProps) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    // Still show the page but without student context
  }

  const params = await searchParams;
  const courseId = params.courseId;
  const errorMsg = params.error;

  return <FailureClient student={student} courseId={courseId} error={errorMsg} />;
}