import { ACCOUNT_STATUSES, type UserRole } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { emailSchema } from "@/lib/validations/common";
import {
  generateSecureToken,
  hashPasswordResetOtp,
  hashToken,
  TOKEN_EXPIRY,
} from "@/lib/auth/tokens";

const MAX_OTP_ATTEMPTS = 5;

export type VerifyPasswordResetOtpResult =
  | { success: true; token: string }
  | { success: false; error: string; status: number };

export async function verifyPasswordResetOtp(
  body: unknown,
  role: UserRole
): Promise<VerifyPasswordResetOtpResult> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Email and OTP are required.", status: 400 };
  }

  const { email: rawEmail, otp: rawOtp } = body as { email?: unknown; otp?: unknown };
  const emailResult = emailSchema.safeParse(rawEmail);
  const otp = typeof rawOtp === "string" ? rawOtp.trim() : "";

  if (!emailResult.success || !/^\d{6}$/.test(otp)) {
    return { success: false, error: "Enter the valid 6-digit OTP.", status: 400 };
  }

  const email = emailResult.data;
  await connectDB();

  const user = await User.findOne({
    email,
    role,
    status: ACCOUNT_STATUSES.ACTIVE,
  }).select("+passwordResetToken +passwordResetTokenExpiresAt +passwordResetOtpAttempts");

  if (
    !user?.passwordResetToken ||
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt <= new Date()
  ) {
    return { success: false, error: "OTP is invalid or has expired.", status: 400 };
  }

  const attempts = user.passwordResetOtpAttempts ?? 0;
  const otpHash = hashPasswordResetOtp(email, otp);

  if (attempts >= MAX_OTP_ATTEMPTS || otpHash !== user.passwordResetToken) {
    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_OTP_ATTEMPTS) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
    } else {
      user.passwordResetOtpAttempts = nextAttempts;
    }
    await user.save();

    return {
      success: false,
      error:
        nextAttempts >= MAX_OTP_ATTEMPTS
          ? "Too many incorrect attempts. Request a new OTP."
          : "OTP is invalid or has expired.",
      status: nextAttempts >= MAX_OTP_ATTEMPTS ? 429 : 400,
    };
  }

  // Exchange the short OTP for a cryptographically strong, short-lived token.
  // Only this token is accepted by the password-change endpoint.
  const resetToken = generateSecureToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetTokenExpiresAt = new Date(
    Date.now() + TOKEN_EXPIRY.PASSWORD_RESET_SESSION
  );
  user.passwordResetOtpAttempts = 0;
  await user.save();

  return { success: true, token: resetToken };
}
