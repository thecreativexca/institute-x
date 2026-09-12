import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentCertificate } from "@/lib/certificates/queries";
import { CertificateDetailClient } from "./CertificateDetailClient";

export const metadata: Metadata = {
  title: "Certificate",
  description: "View your certificate.",
  robots: { index: false, follow: false },
};

type RouteParams = { params: Promise<{ certificateId: string }> };

export default async function CertificateDetailPage({ params }: RouteParams) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const { certificateId } = await params;
  const detail = await getStudentCertificate(student.id, certificateId);
  if (!detail) {
    // Foreign/missing certificates look identical to the client.
    notFound();
  }

  /*
   * The preview URL points at an ownership-checked API route, never at the
   * storage URL — the file itself is streamed through the server.
   */
  return (
    <CertificateDetailClient
      detail={detail}
      previewUrl={`/api/student/certificates/${detail.id}/view`}
      downloadUrl={`/api/student/certificates/${detail.id}/download`}
    />
  );
}
