/**
 * Module 3: Referral Follow-up
 * Flag referrals not reviewed or with no next action
 */

import { AgentState, Alert } from './types';
import { REFERRAL_LOOKBACK_DAYS } from '../config/sla.config';
import { businessDaysBetween } from '../utils/business-days';

function isReferral(app: AgentState['applications'][0], referralSourceIds?: number[]): boolean {
  if (app.referrerId != null) return true;
  if (app.sourceId != null && referralSourceIds?.includes(app.sourceId)) return true;
  const sn = (app.sourceName ?? '').toLowerCase();
  return sn.includes('referral') || sn.includes('employee referral');
}

export class ReferralAgent {
  generateAlerts(state: AgentState): Alert[] {
    const alerts: Alert[] = [];
    const useCutoff = REFERRAL_LOOKBACK_DAYS > 0;
    const cutoff = useCutoff ? (() => {
      const d = new Date();
      d.setDate(d.getDate() - REFERRAL_LOOKBACK_DAYS);
      return d;
    })() : null;

    const referrals = state.applications.filter((app) => isReferral(app, state.referralSourceIds));
    const skippedByCutoff = useCutoff && cutoff
      ? referrals.filter((app) => {
          const createdAt = app.enteredAt ? new Date(app.enteredAt) : null;
          return createdAt && createdAt < cutoff;
        })
      : [];

    console.log('[Referral Agent]', {
      totalApplications: state.applications?.length ?? 0,
      referralsDetected: referrals.length,
      skippedByCutoff: skippedByCutoff.length,
      lookbackDays: REFERRAL_LOOKBACK_DAYS,
      sampleReferrals: referrals.slice(0, 3).map((a) => ({ id: a.id, referrerId: a.referrerId, sourceName: a.sourceName })),
    });

    for (const app of referrals) {
      const createdAt = app.enteredAt ? new Date(app.enteredAt) : null;
      if (useCutoff && cutoff && createdAt && createdAt < cutoff) continue;

      const daysSinceReferral = createdAt ? businessDaysBetween(createdAt, new Date()) : 0;
      const stageName = (app.stageName || '').toLowerCase();
      const isInitialStage = stageName.includes('application') || stageName.includes('review') || stageName.includes('sourced');
      const shouldAlert = (isInitialStage && daysSinceReferral >= 2) || (!isInitialStage && daysSinceReferral >= 5);
      if (!shouldAlert) continue;

      const subType = isInitialStage ? 'not_reviewed' : 'no_next_action';
      alerts.push({
        type: 'referral',
        severity: 'warning',
        payload: {
          subType,
          candidateId: app.candidateId,
          applicationId: app.id,
          candidateName: app.candidateName || `Candidate ${app.candidateId}`,
          jobTitle: app.jobTitle || `Job ${app.jobId}`,
          daysSinceReferral,
          currentStage: app.stageName,
          referrerId: app.referrerId ?? app.sourceId ?? 0,
        },
      });
    }

    return alerts;
  }
}
