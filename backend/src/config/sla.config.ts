/**
 * Configurable stage SLAs (business days)
 * Default values from TA Ops requirements
 */

export const DEFAULT_STAGE_SLAS: Record<string, number> = {
  'Application Review': 3,
  'Recruiter Screen': 5,
  'Hiring Manager Review': 3,
  'Phone Interview': 7,
  'Onsite': 7,
  'Panel': 7,
  'Onsite/Panel': 7,
  'Offer': 5,
  'Reference Check': 5,
};

export const STALE_JOB_DAYS = 10;
export const OFFER_NO_RESPONSE_DAYS = 3;
export const ACTIVE_CANDIDATE_INACTIVITY_DAYS = 14;
export const SCORECARD_DUE_HOURS = 24;
export const SCORECARD_ESCALATE_HOURS = 48;
/** Referral lookback in days. 0 = no cutoff (show all). Use 3650+ for demo data with old applications. */
export const REFERRAL_LOOKBACK_DAYS = Math.max(0, parseInt(process.env.REFERRAL_LOOKBACK_DAYS || '14', 10) || 0);

export function getSlaForStage(stageName: string): number {
  const normalized = stageName.trim();
  return DEFAULT_STAGE_SLAS[normalized] ?? DEFAULT_STAGE_SLAS[Object.keys(DEFAULT_STAGE_SLAS).find(k => 
    normalized.toLowerCase().includes(k.toLowerCase())
  ) ?? ''] ?? 7;
}
