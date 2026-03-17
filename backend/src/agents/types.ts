/**
 * TA Agent State
 */

export interface AgentState {
  jobs: Array<{ id: number; title: string; lastActivityAt?: string }>;
  /** Source IDs from GET /sources where type.name === 'referrals' */
  referralSourceIds?: number[];
  applications: Array<{
    id: number;
    jobId: number;
    candidateId: number;
    stageName: string;
    enteredAt?: string;
    status: string;
    referrerId?: number;
    sourceId?: number;
    sourceName?: string;
    recruiterId?: number;
    hiringManagerId?: number;
    candidateName?: string;
    jobTitle?: string;
  }>;
  scorecards: Array<{ applicationId: number; interviewedAt?: string; submittedBy?: string }>;
  alerts: Alert[];
  userQuery?: string;
}

export interface Alert {
  type: 'stalled' | 'scorecard' | 'referral' | 'open';
  severity: 'warning' | 'critical';
  payload: Record<string, unknown>;
}
