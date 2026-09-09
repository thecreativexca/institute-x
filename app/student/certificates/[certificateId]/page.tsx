import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentCertificate } from "@/lib/certificates/queries";
import { buildCertificateInlineUrl } from "@/lib/certificates/cloudinary";
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
    // Foreign/missing certificates look identical to the client (§47–§48).
    notFound();
  }

  return (
    <CertificateDetailClient
      detail={detail}
      previewUrl={buildCertificateInlineUrl(detail.pdfUrl)}
    />
  );
}
