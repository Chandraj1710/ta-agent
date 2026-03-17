/**
 * Module 1: Stalled Pipeline Alerts
 * - Stage SLA: candidates in stage longer than SLA
 * - Stale Jobs: jobs with no activity in 10 business days
 * - Offers No Response: offers extended 3+ days with no response
 *
 * Conditions (to avoid noise):
 * - Only applications for currently OPEN jobs (jobId in state.jobs)
 * - Only applications that entered stage (or had activity) within STALLED_LOOKBACK_DAYS
 * - Stale jobs: only if dormant between STALE_JOB_DAYS and STALE_JOB_MAX_AGE_DAYS
 */

import { AgentState, Alert } from './types';
import {
  getSlaForStage,
  STALE_JOB_DAYS,
  OFFER_NO_RESPONSE_DAYS,
  STALLED_LOOKBACK_DAYS,
  STALE_JOB_MAX_AGE_DAYS,
} from '../config/sla.config';
import { businessDaysBetween } from '../utils/business-days';

export class StalledPipelineAgent {
  generateAlerts(state: AgentState): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();
    const openJobIds = new Set((state.jobs || []).map((j) => j.id));
    const lookbackCutoff = new Date(now);
    lookbackCutoff.setDate(lookbackCutoff.getDate() - STALLED_LOOKBACK_DAYS);

    for (const app of state.applications) {
      if (!openJobIds.has(app.jobId)) continue;

      const stageName = app.stageName || 'Unknown';
      const enteredAt = app.enteredAt ? new Date(app.enteredAt) : null;

      if (enteredAt) {
        if (enteredAt < lookbackCutoff) continue;

        const daysInStage = businessDaysBetween(enteredAt, now);
        const sla = getSlaForStage(stageName);
        if (daysInStage > sla) {
          alerts.push({
            type: 'stalled',
            severity: daysInStage > sla * 2 ? 'critical' : 'warning',
            payload: {
              subType: 'stage_sla',
              applicationId: app.id,
              jobId: app.jobId,
              candidateId: app.candidateId,
              candidateName: app.candidateName || `Candidate ${app.candidateId}`,
              jobTitle: app.jobTitle || `Job ${app.jobId}`,
              currentStage: stageName,
              daysInStage,
              sla,
              recruiterId: app.recruiterId,
              hiringManagerId: app.hiringManagerId,
              recruiters: app.recruiterId ? `Recruiter ${app.recruiterId}` : undefined,
            },
          });
        }
      }

      if (stageName.toLowerCase().includes('offer') && enteredAt && enteredAt >= lookbackCutoff) {
        const daysSinceOffer = businessDaysBetween(enteredAt, now);
        if (daysSinceOffer >= OFFER_NO_RESPONSE_DAYS) {
          alerts.push({
            type: 'stalled',
            severity: 'warning',
            payload: {
              subType: 'offer_no_response',
              applicationId: app.id,
              jobId: app.jobId,
              candidateId: app.candidateId,
              candidateName: app.candidateName || `Candidate ${app.candidateId}`,
              jobTitle: app.jobTitle || `Job ${app.jobId}`,
              daysSinceOffer,
              recruiterId: app.recruiterId,
              recruiters: app.recruiterId ? `Recruiter ${app.recruiterId}` : undefined,
            },
          });
        }
      }
    }

    for (const job of state.jobs) {
      const lastActivity = job.lastActivityAt ? new Date(job.lastActivityAt) : null;
      if (lastActivity) {
        const daysSinceActivity = businessDaysBetween(lastActivity, now);
        if (daysSinceActivity >= STALE_JOB_DAYS && daysSinceActivity <= STALE_JOB_MAX_AGE_DAYS) {
          alerts.push({
            type: 'stalled',
            severity: 'warning',
            payload: {
              subType: 'stale_job',
              jobTitle: job.title,
              jobId: job.id,
              daysSinceActivity,
            },
          });
        }
      }
    }

    return alerts;
  }
}
