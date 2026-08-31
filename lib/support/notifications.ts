import { sendSupportCreatedEmail, sendSupportReplyEmail, sendSupportResolvedEmail } from "@/lib/email/events";

export async function notifyTicketCreated(
  studentId: string,
  studentName: string,
  studentEmail: string,
  ticketNumber: string,
  subject: string
): Promise<void> {
  try {
    await sendSupportCreatedEmail({
      studentId,
      studentName,
      studentEmail,
      ticketNumber,
      subject,
    });
  } catch (error) {
    console.error("Failed to send ticket created email:", error);
  }
}

export async function notifyTicketReply(
  studentId: string,
  studentName: string,
  studentEmail: string,
  ticketNumber: string,
  subject: string,
  replyMessage: string,
  replierName: string,
  messageId: string
): Promise<void> {
  try {
    await sendSupportReplyEmail({
      studentId,
      studentName,
      studentEmail,
      ticketNumber,
      subject,
      replyMessage,
      replierName,
      messageId,
    });
  } catch (error) {
    console.error("Failed to send ticket reply email:", error);
  }
}

export async function notifyTicketResolved(
  studentId: string,
  studentName: string,
  studentEmail: string,
  ticketNumber: string,
  subject: string
): Promise<void> {
  try {
    await sendSupportResolvedEmail({
      studentId,
      studentName,
      studentEmail,
      ticketNumber,
      subject,
    });
  } catch (error) {
    console.error("Failed to send ticket resolved email:", error);
  }
}