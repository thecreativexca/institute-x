import type { AccountStatus, UserRole } from "@/lib/constants";
import type { BaseDocument } from "./common";

/**
 * Client-safe (serialized) user shape.
 * NEVER include password hashes or server-only secrets here.
 */
export interface User extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
}

export interface PublicStudentProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}
