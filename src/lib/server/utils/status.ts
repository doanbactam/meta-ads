// Prisma schema enums
export type CampaignStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'PENDING'
  | 'ENDED'
  | 'DISAPPROVED'
  | 'REMOVED';
export type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'PENDING' | 'ENDED';
export type CreativeStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'PENDING'
  | 'REVIEW'
  | 'REJECTED'
  | 'DISAPPROVED';

const CAMPAIGN_ALIASES: Record<string, CampaignStatus> = {
  ACTIVE: 'ACTIVE',
  Active: 'ACTIVE',
  active: 'ACTIVE',
  PAUSED: 'PAUSED',
  Paused: 'PAUSED',
  paused: 'PAUSED',
  DELETED: 'DELETED',
  Deleted: 'DELETED',
  deleted: 'DELETED',
  ARCHIVED: 'ARCHIVED',
  Archived: 'ARCHIVED',
  archived: 'ARCHIVED',
  PENDING: 'PENDING',
  Pending: 'PENDING',
  pending: 'PENDING',
  ENDED: 'ENDED',
  Ended: 'ENDED',
  ended: 'ENDED',
  DISAPPROVED: 'DISAPPROVED',
  Disapproved: 'DISAPPROVED',
  disapproved: 'DISAPPROVED',
  REMOVED: 'REMOVED',
  Removed: 'REMOVED',
  removed: 'REMOVED',
  ELIGIBLE: 'ACTIVE',
  Eligible: 'ACTIVE',
  eligible: 'ACTIVE',
  INACTIVE: 'PAUSED',
  Inactive: 'PAUSED',
  inactive: 'PAUSED',
};

const ADSET_ALIASES: Record<string, AdSetStatus> = {
  ACTIVE: 'ACTIVE',
  Active: 'ACTIVE',
  active: 'ACTIVE',
  PAUSED: 'PAUSED',
  Paused: 'PAUSED',
  paused: 'PAUSED',
  DELETED: 'DELETED',
  Deleted: 'DELETED',
  deleted: 'DELETED',
  ARCHIVED: 'ARCHIVED',
  Archived: 'ARCHIVED',
  archived: 'ARCHIVED',
  PENDING: 'PENDING',
  Pending: 'PENDING',
  pending: 'PENDING',
  ENDED: 'ENDED',
  Ended: 'ENDED',
  ended: 'ENDED',
  ELIGIBLE: 'ACTIVE',
  Eligible: 'ACTIVE',
  eligible: 'ACTIVE',
  INACTIVE: 'PAUSED',
  Inactive: 'PAUSED',
  inactive: 'PAUSED',
  REMOVED: 'DELETED',
  Removed: 'DELETED',
  removed: 'DELETED',
  DISAPPROVED: 'PAUSED',
  Disapproved: 'PAUSED',
  disapproved: 'PAUSED',
};

const CREATIVE_ALIASES: Record<string, CreativeStatus> = {
  ACTIVE: 'ACTIVE',
  Active: 'ACTIVE',
  active: 'ACTIVE',
  PAUSED: 'PAUSED',
  Paused: 'PAUSED',
  paused: 'PAUSED',
  DELETED: 'DELETED',
  Deleted: 'DELETED',
  deleted: 'DELETED',
  ARCHIVED: 'ARCHIVED',
  Archived: 'ARCHIVED',
  archived: 'ARCHIVED',
  PENDING: 'PENDING',
  Pending: 'PENDING',
  pending: 'PENDING',
  REVIEW: 'REVIEW',
  Review: 'REVIEW',
  review: 'REVIEW',
  REJECTED: 'REJECTED',
  Rejected: 'REJECTED',
  rejected: 'REJECTED',
  DISAPPROVED: 'DISAPPROVED',
  Disapproved: 'DISAPPROVED',
  disapproved: 'DISAPPROVED',
  ELIGIBLE: 'ACTIVE',
  Eligible: 'ACTIVE',
  eligible: 'ACTIVE',
  INACTIVE: 'PAUSED',
  Inactive: 'PAUSED',
  inactive: 'PAUSED',
  REMOVED: 'DELETED',
  Removed: 'DELETED',
  removed: 'DELETED',
  ENDED: 'ARCHIVED',
  Ended: 'ARCHIVED',
  ended: 'ARCHIVED',
};

export function normalizeCampaignStatus(
  input: string | null | undefined,
  fallback: CampaignStatus = 'PAUSED'
): CampaignStatus {
  if (!input) return fallback;
  return CAMPAIGN_ALIASES[input] || CAMPAIGN_ALIASES[input.toUpperCase()] || fallback;
}

export function normalizeAdSetStatus(
  input: string | null | undefined,
  fallback: AdSetStatus = 'PAUSED'
): AdSetStatus {
  if (!input) return fallback;
  return ADSET_ALIASES[input] || ADSET_ALIASES[input.toUpperCase()] || fallback;
}

export function normalizeCreativeStatus(
  input: string | null | undefined,
  fallback: CreativeStatus = 'PAUSED'
): CreativeStatus {
  if (!input) return fallback;
  return CREATIVE_ALIASES[input] || CREATIVE_ALIASES[input.toUpperCase()] || fallback;
}

// Backward compatibility - defaults to campaign
export function normalizeStatus(
  input: string | null | undefined,
  fallback: CampaignStatus = 'PAUSED'
): CampaignStatus {
  return normalizeCampaignStatus(input, fallback);
}
