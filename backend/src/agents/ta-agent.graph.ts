/**
 * TA Agent Graph
 * fetch_greenhouse_data → generate_alerts → format_response
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { AgentState } from './types';
import { getGreenhouseService } from '../services/greenhouse.factory';
import { StalledPipelineAgent } from './stalled-pipeline.agent';
import { ScorecardAgent } from './scorecard.agent';
import { ReferralAgent } from './referral.agent';
const stalledAgent = new StalledPipelineAgent();
const scorecardAgent = new ScorecardAgent();
const referralAgent = new ReferralAgent();

export class TAAgentGraph {
  private graph = this.buildGraph();

  private buildGraph() {
    type NodeKey = 'fetch_greenhouse_data' | 'generate_alerts' | 'format_response';
    const workflow = new StateGraph<AgentState, Partial<AgentState>, NodeKey>({
      channels: {
        jobs: null,
        applications: null,
        scorecards: null,
        alerts: null,
        userQuery: null,
        referralSourceIds: null,
      },
    });

    workflow.addNode('fetch_greenhouse_data', async () => {
      const greenhouse = getGreenhouseService();
      const [jobs, applications, scorecards, sources] = await Promise.all([
        greenhouse.getJobs('open'),
        greenhouse.getApplications(undefined, 'active'),
        greenhouse.getScorecards({
          created_after: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        }),
        greenhouse.getSources(),
      ]);

      const referralSourceIds = sources.filter((s) => (s.type?.name ?? '').toLowerCase() === 'referrals').map((s) => s.id);
      if (referralSourceIds.length > 0) {
        console.log('[TA Agent] Referral source IDs from API:', referralSourceIds);
      }

      const openJobIds = new Set(jobs.map((j) => j.id));
      let applicationsForOpenJobs = applications.filter((a) => {
        const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined);
        return jobId != null && openJobIds.has(jobId);
      });

      // Location filter: restrict to India (or other regions) via GREENHOUSE_LOCATION_FILTER
      const locationFilter = process.env.GREENHOUSE_LOCATION_FILTER?.trim();
      if (locationFilter) {
        const terms = locationFilter.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
        const jobIdsWithMatchingOffice = new Set(
          jobs
            .filter((j) =>
              terms.some((term) =>
                (j.offices ?? []).some((o) => (o.name ?? '').toLowerCase().includes(term))
              )
            )
            .map((j) => j.id)
        );
        const filtered = applicationsForOpenJobs.filter((a) => {
          const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined);
          const appLocation = (a.location?.address ?? '').toLowerCase();
          const jobMatchesOffice = jobId != null && jobIdsWithMatchingOffice.has(jobId);
          const appMatchesLocation = terms.some((term) => appLocation.includes(term));
          return jobMatchesOffice || appMatchesLocation;
        });
        // Only apply filter if it returns data - otherwise it may exclude referrals (many apps have location: null)
        if (filtered.length > 0) {
          applicationsForOpenJobs = filtered;
          console.log('[TA Agent] Location filter:', locationFilter, 'applications:', applicationsForOpenJobs.length);
        } else {
          console.warn('[TA Agent] Location filter', locationFilter, 'matched 0 applications (location/office may be empty). Showing all.');
        }
      }

      const withReferrer = applicationsForOpenJobs.filter((a) => {
        const rid = a.referrer?.id ?? a.credited_to?.id ?? (a as { credited_to_id?: number }).credited_to_id;
        return rid != null;
      });
      const withSource = applicationsForOpenJobs.filter((a) => {
        const src = a.source as { public_name?: string; name?: string } | undefined;
        const sn = (src?.public_name ?? src?.name ?? '').toLowerCase();
        return sn.includes('referral');
      });
      const withReferralSourceId = applicationsForOpenJobs.filter((a) => {
        const sid = a.source?.id;
        return sid != null && referralSourceIds.includes(sid);
      });
      console.log('[TA Agent] Fetched:', {
        jobs: jobs.length,
        applications: applications.length,
        applicationsForOpenJobs: applicationsForOpenJobs.length,
        withReferrerOrCreditedTo: withReferrer.length,
        withReferralSource: withSource.length,
        withReferralSourceId: withReferralSourceId.length,
        referralSourceIdsCount: referralSourceIds.length,
        sampleSources: [...new Set(applicationsForOpenJobs.slice(0, 10).map((a) => {
          const src = a.source as { public_name?: string; name?: string } | undefined;
          return src?.public_name ?? src?.name ?? '(none)';
        }))],
      });

      // Skip per-candidate API calls - they cause N requests and make refresh hang.
      // Use "Candidate {id}" as fallback; agents already support missing candidateName.
      const appWithDetails: AgentState['applications'] = applicationsForOpenJobs
        .filter((a) => {
          const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined);
          return jobId != null;
        })
        .map((a) => {
          const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined)!;
          const referrerId = a.referrer?.id ?? a.credited_to?.id ?? (a as { credited_to_id?: number }).credited_to_id;
          const src = a.source as { public_name?: string; name?: string } | undefined;
          const sourceName = (src?.public_name ?? src?.name ?? '').toLowerCase();
          const sourceId = a.source?.id;
          const job = jobs.find((j) => j.id === jobId);
          return {
            id: a.id,
            jobId,
            candidateId: a.candidate_id,
            stageName: a.current_stage?.name || 'Unknown',
            enteredAt: a.last_activity_at || a.updated_at,
            status: a.status,
            referrerId,
            sourceId,
            sourceName,
            candidateName: `Candidate ${a.candidate_id}`,
            jobTitle: job?.name || `Job ${a.job_id}`,
          };
        });

      const jobIdsInUse = new Set(appWithDetails.map((a) => a.jobId));
      const filteredJobs = locationFilter ? jobs.filter((j) => jobIdsInUse.has(j.id)) : jobs;

      return {
        referralSourceIds,
        jobs: filteredJobs.map((j) => ({
          id: j.id,
          title: j.name,
          lastActivityAt: j.updated_at,
        })),
        applications: appWithDetails,
        scorecards: scorecards.map((s) => ({
          applicationId: s.application_id,
          interviewedAt: s.interviewed_at,
          submittedBy: s.submitted_by?.name,
        })),
      };
    });

    workflow.addNode('generate_alerts', (state: AgentState) => {
      const stalledAlerts = stalledAgent.generateAlerts(state);
      const submittedMap = new Map<number, boolean>();
      for (const sc of state.scorecards || []) {
        submittedMap.set(sc.applicationId, true);
      }
      // Interviews: use applications in interview stages as proxy (skeleton)
      // Production: fetch from GET /v2/scheduled_interviews
      const interviews = (state.applications || [])
        .filter((a) => /interview|onsite|panel|phone/i.test(a.stageName || ''))
        .map((a) => ({
          applicationId: a.id,
          interviewedAt: a.enteredAt || new Date().toISOString(),
          candidateName: a.candidateName,
          jobTitle: a.jobTitle,
        }));
      const scorecardAlerts = scorecardAgent.generateAlerts(interviews, submittedMap);
      const referralAlerts = referralAgent.generateAlerts(state);

      const allAlerts = [...stalledAlerts, ...scorecardAlerts, ...referralAlerts];
      return { alerts: allAlerts };
    });

    workflow.addNode('format_response', (state: AgentState) => state);

    workflow.addEdge(START, 'fetch_greenhouse_data');
    workflow.addEdge('fetch_greenhouse_data', 'generate_alerts');
    workflow.addEdge('generate_alerts', 'format_response');
    workflow.addEdge('format_response', END);

    return workflow.compile();
  }

  async run(): Promise<AgentState> {
    const result = await this.graph.invoke({
      jobs: [],
      applications: [],
      scorecards: [],
      alerts: [],
      referralSourceIds: undefined,
    });
    return result as AgentState;
  }
}

export function createTAAgent(): TAAgentGraph {
  return new TAAgentGraph();
}
