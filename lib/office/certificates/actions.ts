"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { recordAuditEvent } from "@/lib/audit/log";
import { getValidatedSession } from "@/lib/auth/helpers";
import { CERTIFICATE_STATUSES, PERMISSIONS } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { notifyUser } from "@/lib/notifications/service";
import { requirePermission } from "@/lib/office/courses/permissions";
import { Certificate } from "@/models/Certificate";

const reasonSchema = z.string().trim().min(5, "Provide a short reason.").max(500);
export async function revokeCertificateAction(certificateId: string, reason: string) {
  try {
    const { user } = await getValidatedSession(); const admin = requirePermission(user, PERMISSIONS.CERTIFICATES_REVOKE);
    if (!Types.ObjectId.isValid(certificateId)) return { ok: false, error: "Invalid certificate." };
    const parsed = reasonSchema.safeParse(reason); if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
    await connectDB();
    const certificate = await Certificate.findOneAndUpdate({ _id: certificateId, status: CERTIFICATE_STATUSES.ISSUED }, { $set: { status: CERTIFICATE_STATUSES.REVOKED, revokedAt: new Date(), revokedBy: admin.id, revocationReason: parsed.data } }, { new: true });
    if (!certificate) return { ok: false, error: "Certificate not found or already revoked." };
    await recordAuditEvent({ actorUserId: admin.id, actorRole: admin.role, action: "certificate.revoke", entityType: "certificate", entityId: certificateId, metadata: { certificateNumber: certificate.certificateNumber, reason: parsed.data } });
    try { await notifyUser({ recipientId: certificate.student, title: "Certificate revoked", message: `${certificate.certificateNumber} has been revoked. Reason: ${parsed.data}`, type: "warning", link: `/student/certificates/${certificate._id.toString()}` }); } catch (error) { console.error("Certificate notification failed:", error); }
    revalidatePath("/office/certificates"); revalidatePath("/student/certificates"); revalidatePath(`/verify-certificate/${certificate.verificationCode}`);
    return { ok: true, message: "Certificate revoked." };
  } catch (error) { console.error("Certificate revoke failed:", error); return { ok: false, error: "Unable to revoke the certificate." }; }
}
