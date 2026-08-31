import { Resend } from "resend";

import { env } from "@/lib/config/env";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    if (!env.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendInstance = new Resend(env.resendApiKey);
  }
  return resendInstance;
}

export function getResendFromEmail(): string {
  return env.resendFromEmail;
}

export function getResendFromName(): string {
  return env.resendFromName;
}