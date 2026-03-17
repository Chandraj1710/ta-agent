/**
 * TA Agent Graph
 * fetch_greenhouse_data → generate_alerts → format_response
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { AgentState } from './types';
import GreenhouseService from '../services/greenhouse.service';
import { StalledPipelineAgent } from './stalled-pipeline.agent';
import { ScorecardAgent } from './scorecard.agent';
import { ReferralAgent } from './referral.agent';

const greenhouse = new GreenhouseService();
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
      },
    });

    workflow.addNode('fetch_greenhouse_data', async () => {
      const [jobs, applications, scorecards] = await Promise.all([
        greenhouse.getJobs('open'),
        greenhouse.getApplications(undefined, 'active'),
        greenhouse.getScorecards({
          created_after: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        }),
      ]);

      const appWithDetails: AgentState['applications'] = [];
      for (const a of applications) {
        try {
          const candidate = await greenhouse.getCandidate(a.candidate_id);
          const job = jobs.find((j) => j.id === a.job_id);
          appWithDetails.push({
            id: a.id,
            jobId: a.job_id,
            candidateId: a.candidate_id,
            stageName: a.current_stage?.name || 'Unknown',
            enteredAt: a.last_activity_at || a.updated_at,
            status: a.status,
            referrerId: a.referrer?.id,
            candidateName: `${candidate.first_name} ${candidate.last_name}`.trim(),
            jobTitle: job?.name || `Job ${a.job_id}`,
          });
        } catch {
          appWithDetails.push({
            id: a.id,
            jobId: a.job_id,
            candidateId: a.candidate_id,
            stageName: a.current_stage?.name || 'Unknown',
            enteredAt: a.last_activity_at || a.updated_at,
            status: a.status,
            referrerId: a.referrer?.id,
            jobTitle: jobs.find((j) => j.id === a.job_id)?.name || `Job ${a.job_id}`,
          });
        }
      }

      return {
        jobs: jobs.map((j) => ({
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
    });
    return result as AgentState;
  }
}

export function createTAAgent(): TAAgentGraph {
  return new TAAgentGraph();
}
