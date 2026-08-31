import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { listCertificateEligibleEnrollments } from "@/lib/certificates/issue";
import { listStudentCertificates } from "@/lib/certificates/queries";
import { StudentCertificatesClient } from "./StudentCertificatesClient";

export const metadata: Metadata = {
  title: "Certificates",
  description: "View, download and verify your earned certificates.",
  robots: { index: false, follow: false },
};

export default async function StudentCertificatesPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  const [certificates, eligible] = await Promise.all([
    listStudentCertificates(student.id),
    listCertificateEligibleEnrollments(student.id),
  ]);

  return (
    <StudentCertificatesClient
      certificates={certificates}
      eligible={eligible}
    />
  );
}