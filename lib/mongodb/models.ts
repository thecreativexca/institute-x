/**
 * Central model registry — the ONLY place application code imports models from.
 * Importing here guarantees every model is registered exactly once per process.
 *
 * Server-side usage only (route handlers, server actions, scripts).
 */
export { Category, type ICategory } from "@/models/Category";
export { Course, type ICourse } from "@/models/Course";
export { Module, type IModule } from "@/models/Module";
export { Lesson, type ILesson } from "@/models/Lesson";
export { Session, type ISession } from "@/models/Session";
export { Enrollment, type IEnrollment } from "@/models/Enrollment";
export { Progress, type IProgress } from "@/models/Progress";
export { Assignment, type IAssignment } from "@/models/Assignment";
export { Submission, type ISubmission } from "@/models/Submission";
export { Resource, type IResource } from "@/models/Resource";
export { Quiz, type IQuiz } from "@/models/Quiz";
export { Question, type IQuestion, type IQuestionOption } from "@/models/Question";
export { QuizAttempt, type IQuizAttempt } from "@/models/QuizAttempt";
export { Certificate, type ICertificate } from "@/models/Certificate";
export { CertificateSequence, type ICertificateSequence } from "@/models/CertificateSequence";
export { Announcement, type IAnnouncement } from "@/models/Announcement";
export { SupportTicket, type ISupportTicket } from "@/models/SupportTicket";
export { User, type IUser } from "@/models/User";
export { Payment, type IPayment } from "@/models/Payment";
export { EmailLog, type IEmailLog } from "@/models/EmailLog";
export { AuditLog, type IAuditLog } from "@/models/AuditLog";
export {
  EMAIL_EVENTS,
  type EmailEventKey,
  EMAIL_STATUSES,
  type EmailStatus,
} from "@/models/EmailLog";

export { connectDB, disconnectDB } from "@/lib/db/connect";
