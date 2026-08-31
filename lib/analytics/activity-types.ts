/**
 * Phase 19 — Office activity / audit viewer types (Part J, spec §69–§74).
 */

export interface AuditFilter {
  actorId?: string;
  role?: string;
  action?: string;
  entityType?: string;
}

export interface AuditEntry {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  timestamp: string;
  summary: string;
  group: string;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}