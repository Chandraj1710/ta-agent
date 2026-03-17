/**
 * Module 1: Stalled Pipeline Alerts
 * - Stage SLA: candidates in stage longer than SLA
 * - Stale Jobs: jobs with no activity in 10 business days
 * - Offers No Response: offers extended 3+ days with no response
 */

import { AgentState, Alert } from './types';
import { getSlaForStage, STALE_JOB_DAYS, OFFER_NO_RESPONSE_DAYS } from '../config/sla.config';
import { businessDaysBetween } from '../utils/business-days';

export class StalledPipelineAgent {
  generateAlerts(state: AgentState): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    for (const app of state.applications) {
      const stageName = app.stageName || 'Unknown';
      const enteredAt = app.enteredAt ? new Date(app.enteredAt) : null;

      if (enteredAt) {
        const daysInStage = businessDaysBetween(enteredAt, now);
        const sla = getSlaForStage(stageName);
        if (daysInStage > sla) {
          alerts.push({
            type: 'stalled',
            severity: daysInStage > sla * 2 ? 'critical' : 'warning',
            payload: {
              subType: 'stage_sla',
              candidateName: app.candidateName || `Candidate ${app.candidateId}`,
              jobTitle: app.jobTitle || `Job ${app.jobId}`,
              currentStage: stageName,
              daysInStage,
              sla,
              recruiterId: app.recruiterId,
              hiringManagerId: app.hiringManagerId,
            },
          });
        }
      }

      if (stageName.toLowerCase().includes('offer') && enteredAt) {
        const daysSinceOffer = businessDaysBetween(enteredAt, now);
        if (daysSinceOffer >= OFFER_NO_RESPONSE_DAYS) {
          alerts.push({
            type: 'stalled',
            severity: 'warning',
            payload: {
              subType: 'offer_no_response',
              candidateName: app.candidateName || `Candidate ${app.candidateId}`,
              jobTitle: app.jobTitle || `Job ${app.jobId}`,
              daysSinceOffer,
              recruiterId: app.recruiterId,
            },
          });
        }
      }
    }

    for (const job of state.jobs) {
      const lastActivity = job.lastActivityAt ? new Date(job.lastActivityAt) : null;
      if (lastActivity) {
        const daysSinceActivity = businessDaysBetween(lastActivity, now);
        if (daysSinceActivity >= STALE_JOB_DAYS) {
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
