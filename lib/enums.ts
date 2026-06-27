/**
 * Database-agnostic enums.
 *
 * Postgres (Vercel) generates these as real Prisma enums, but SQLite (local
 * demo) stores them as plain strings. To keep ONE codebase working on both,
 * import enum values/types from here instead of '@prisma/client'. The string
 * values are identical to the Prisma enum values, so they remain assignable to
 * the Postgres enum columns.
 */
function asEnum<T extends Record<string, string>>(o: T) {
  return Object.freeze(o);
}

export const UserRole = asEnum({
  SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', MANAGER: 'MANAGER', SALES: 'SALES', USER: 'USER',
});
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AuditAction = asEnum({
  LOGIN: 'LOGIN', LOGOUT: 'LOGOUT', REGISTER: 'REGISTER', PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET', OAUTH_LOGIN: 'OAUTH_LOGIN', ACCOUNT_LINK: 'ACCOUNT_LINK',
  PROFILE_UPDATE: 'PROFILE_UPDATE', ROLE_CHANGE: 'ROLE_CHANGE', DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  SESSION_REFRESH: 'SESSION_REFRESH',
});
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const LeadStatus = asEnum({
  NEW: 'NEW', CONTACTED: 'CONTACTED', QUALIFIED: 'QUALIFIED', CONVERTED: 'CONVERTED', LOST: 'LOST',
});
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadActivityType = asEnum({
  CREATED: 'CREATED', UPDATED: 'UPDATED', STATUS_CHANGED: 'STATUS_CHANGED',
  TAG_ADDED: 'TAG_ADDED', TAG_REMOVED: 'TAG_REMOVED', NOTE_ADDED: 'NOTE_ADDED',
});
export type LeadActivityType = (typeof LeadActivityType)[keyof typeof LeadActivityType];

export const ApprovalStatus = asEnum({
  PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED', SENT: 'SENT',
});
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const AIMessageType = asEnum({
  CONNECTION_MESSAGE: 'CONNECTION_MESSAGE', FOLLOWUP_MESSAGE: 'FOLLOWUP_MESSAGE',
  SALES_PITCH: 'SALES_PITCH', COLD_OUTREACH: 'COLD_OUTREACH',
  CALL_INVITATION: 'CALL_INVITATION', REENGAGEMENT: 'REENGAGEMENT',
});
export type AIMessageType = (typeof AIMessageType)[keyof typeof AIMessageType];

export const MessageTone = asEnum({
  PROFESSIONAL: 'PROFESSIONAL', FRIENDLY: 'FRIENDLY', CONSULTATIVE: 'CONSULTATIVE',
  DIRECT: 'DIRECT', EXECUTIVE: 'EXECUTIVE',
});
export type MessageTone = (typeof MessageTone)[keyof typeof MessageTone];

export const MessageLength = asEnum({ SHORT: 'SHORT', MEDIUM: 'MEDIUM', LONG: 'LONG' });
export type MessageLength = (typeof MessageLength)[keyof typeof MessageLength];

export const CampaignStatus = asEnum({
  DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', ARCHIVED: 'ARCHIVED',
});
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const WorkflowStepType = asEnum({
  MESSAGE: 'MESSAGE', DELAY: 'DELAY', CONDITION: 'CONDITION', BRANCH: 'BRANCH',
});
export type WorkflowStepType = (typeof WorkflowStepType)[keyof typeof WorkflowStepType];

export const CampaignLeadStatus = asEnum({
  PENDING: 'PENDING', SENT: 'SENT', OPENED: 'OPENED', REPLIED: 'REPLIED',
  FAILED: 'FAILED', SKIPPED: 'SKIPPED',
});
export type CampaignLeadStatus = (typeof CampaignLeadStatus)[keyof typeof CampaignLeadStatus];

export const WorkflowExecutionStatus = asEnum({
  RUNNING: 'RUNNING', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', FAILED: 'FAILED', CANCELLED: 'CANCELLED',
});
export type WorkflowExecutionStatus = (typeof WorkflowExecutionStatus)[keyof typeof WorkflowExecutionStatus];

export const ContentType = asEnum({
  LINKEDIN_POST: 'LINKEDIN_POST', INSTAGRAM_CAPTION: 'INSTAGRAM_CAPTION', POSTER: 'POSTER',
  VIDEO_SCRIPT: 'VIDEO_SCRIPT', JOB_POST: 'JOB_POST', COMPANY_ANNOUNCEMENT: 'COMPANY_ANNOUNCEMENT',
});
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const PublishingStatus = asEnum({
  DRAFT: 'DRAFT', PENDING: 'PENDING', SCHEDULED: 'SCHEDULED', PUBLISHING: 'PUBLISHING',
  PUBLISHED: 'PUBLISHED', CANCELLED: 'CANCELLED', FAILED: 'FAILED',
});
export type PublishingStatus = (typeof PublishingStatus)[keyof typeof PublishingStatus];

export const IntegrationProvider = asEnum({
  LINKEDIN: 'LINKEDIN', INSTAGRAM: 'INSTAGRAM', GOOGLE: 'GOOGLE',
});
export type IntegrationProvider = (typeof IntegrationProvider)[keyof typeof IntegrationProvider];

export const IntegrationStatus = asEnum({
  ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', EXPIRED: 'EXPIRED',
});
export type IntegrationStatus = (typeof IntegrationStatus)[keyof typeof IntegrationStatus];
