/**
 * Module 2: Scorecard Accountability
 * Flag interviewers who haven't submitted scorecards within 24h
 * 24-48h overdue: flag to recruiter
 * 48h+ overdue: flag to TA leader
 */

import { AgentState, Alert } from './types';
import { SCORECARD_DUE_HOURS, SCORECARD_ESCALATE_HOURS } from '../config/sla.config';
import { hoursSince } from '../utils/business-days';

export interface InterviewRecord {
  applicationId: number;
  interviewedAt: string;
  interviewerName?: string;
  candidateName?: string;
  jobTitle?: string;
  recruiterId?: number;
}

export class ScorecardAgent {
  generateAlerts(
    interviews: InterviewRecord[],
    submittedScorecards: Map<number, boolean>
  ): Alert[] {
    const alerts: Alert[] = [];
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    for (const iv of interviews) {
      const interviewedAt = new Date(iv.interviewedAt);
      if (interviewedAt < cutoff) continue;

      const appId = iv.applicationId;
      if (submittedScorecards.get(appId)) continue;

      const hours = hoursSince(interviewedAt);
      if (hours < SCORECARD_DUE_HOURS) continue;

      const severity = hours >= SCORECARD_ESCALATE_HOURS ? 'critical' : 'warning';
      alerts.push({
        type: 'scorecard',
        severity,
        payload: {
          interviewerName: iv.interviewerName || 'Unknown',
          candidateName: iv.candidateName || `Candidate`,
          jobTitle: iv.jobTitle || 'Unknown',
          interviewDate: iv.interviewedAt,
          hoursSinceInterview: Math.round(hours),
          escalateToTALeader: hours >= SCORECARD_ESCALATE_HOURS,
          recruiterId: iv.recruiterId,
          recruiters: iv.recruiterId ? `Recruiter ${iv.recruiterId}` : undefined,
        },
      });
    }

    return alerts;
  }
}
