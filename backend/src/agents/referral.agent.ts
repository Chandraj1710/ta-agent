/**
 * Module 3: Referral Follow-up
 * Flag referrals not reviewed or with no next action
 */

import { AgentState, Alert } from './types';
import { REFERRAL_LOOKBACK_DAYS } from '../config/sla.config';
import { businessDaysBetween } from '../utils/business-days';

export class ReferralAgent {
  generateAlerts(state: AgentState): Alert[] {
    const alerts: Alert[] = [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - REFERRAL_LOOKBACK_DAYS);

    const referrals = state.applications.filter((a) => a.referrerId != null);
    for (const app of referrals) {
      const createdAt = app.enteredAt ? new Date(app.enteredAt) : null;
      if (createdAt && createdAt < cutoff) continue;

      const daysSinceReferral = createdAt ? businessDaysBetween(createdAt, new Date()) : 0;
      const stageName = (app.stageName || '').toLowerCase();
      const isInitialStage = stageName.includes('application') || stageName.includes('review') || stageName.includes('sourced');

      if (isInitialStage && daysSinceReferral >= 2) {
        alerts.push({
          type: 'referral',
          severity: 'warning',
          payload: {
            subType: 'not_reviewed',
            candidateName: app.candidateName || `Candidate ${app.candidateId}`,
            jobTitle: app.jobTitle || `Job ${app.jobId}`,
            daysSinceReferral,
            currentStage: app.stageName,
            referrerId: app.referrerId,
          },
        });
      } else if (!isInitialStage && daysSinceReferral >= 5) {
        alerts.push({
          type: 'referral',
          severity: 'warning',
          payload: {
            subType: 'no_next_action',
            candidateName: app.candidateName || `Candidate ${app.candidateId}`,
            jobTitle: app.jobTitle || `Job ${app.jobId}`,
            daysSinceReferral,
            currentStage: app.stageName,
            referrerId: app.referrerId,
          },
        });
      }
    }

    return alerts;
  }
}
