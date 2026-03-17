/**
 * TA Agent State
 */

export interface AgentState {
  jobs: Array<{ id: number; title: string; lastActivityAt?: string }>;
  applications: Array<{
    id: number;
    jobId: number;
    candidateId: number;
    stageName: string;
    enteredAt?: string;
    status: string;
    referrerId?: number;
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
  type: 'stalled' | 'scorecard' | 'referral';
  severity: 'warning' | 'critical';
  payload: Record<string, unknown>;
}
