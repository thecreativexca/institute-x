import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { listStudentCertificates } from "@/lib/certificates/queries";
import { StudentCertificatesClient } from "./StudentCertificatesClient";

export const metadata: Metadata = {
  title: "My Certificates",
  description: "View, download and verify certificates issued to you.",
  robots: { index: false, follow: false },
};

/**
 * My Certificates (student).
 *
 * Read-only by design: certificates are issued by the institute, so there is no
 * generate/upload/edit surface here. The list is loaded from the authenticated
 * session id — the client never supplies a student id.
 */
export default async function StudentCertificatesPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const certificates = await listStudentCertificates(student.id);

  return <StudentCertificatesClient certificates={certificates} />;
}
