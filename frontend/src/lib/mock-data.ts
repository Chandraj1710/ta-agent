/**
 * Mock data for TA Ops Agent - full user flow without backend/APIs
 * Matches PLAN.md: Modules 1, 2, 3 use cases
 */

export interface MockAlert {
  id: string;
  type: 'stalled' | 'scorecard' | 'referral';
  severity: 'warning' | 'critical';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface MockJob {
  id: number;
  title: string;
  status: string;
  department?: string;
  updatedAt?: string;
}

export interface MockProvider {
  id: string;
  name: string;
  models: string[];
  pricing: string;
  speed: string;
  quality: string;
  requiresApiKey: boolean;
  freeOption: boolean;
}

// Module 1: Stalled Pipeline - Stage SLA, Stale Jobs, Offers No Response
const STALLED_ALERTS: MockAlert[] = [
  {
    id: 'stalled-1',
    type: 'stalled',
    severity: 'warning',
    payload: {
      subType: 'stage_sla',
      candidateName: 'Chandraj',
      jobTitle: 'Senior Software Engineer',
      currentStage: 'Recruiter Screen',
      daysInStage: 7,
      sla: 5,
      recruiters: 'Derek David',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stalled-2',
    type: 'stalled',
    severity: 'critical',
    payload: {
      subType: 'stage_sla',
      candidateName: 'Bala',
      jobTitle: 'Product Manager',
      currentStage: 'Application Review',
      daysInStage: 8,
      sla: 3,
      recruiters: 'Iniya',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stalled-3',
    type: 'stalled',
    severity: 'warning',
    payload: {
      subType: 'offer_no_response',
      candidateName: 'Ilankumaran',
      jobTitle: 'Data Analyst',
      daysSinceOffer: 4,
      recruiters: 'Libin',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stalled-4',
    type: 'stalled',
    severity: 'warning',
    payload: {
      subType: 'stale_job',
      jobTitle: 'DevOps Engineer',
      jobId: 1001,
      daysSinceActivity: 12,
      recruiters: 'Derek David',
    },
    createdAt: new Date().toISOString(),
  },
];

// Module 2: Scorecard Accountability - Missing scorecards 24h+ after interview
const SCORECARD_ALERTS: MockAlert[] = [
  {
    id: 'scorecard-1',
    type: 'scorecard',
    severity: 'warning',
    payload: {
      interviewerName: 'David Kim',
      candidateName: 'Chandraj',
      jobTitle: 'Frontend Engineer',
      interviewDate: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      hoursSinceInterview: 28,
      escalateToTALeader: false,
      recruiters: 'Iniya',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'scorecard-2',
    type: 'scorecard',
    severity: 'critical',
    payload: {
      interviewerName: 'Jennifer Park',
      candidateName: 'Bala',
      jobTitle: 'Senior Software Engineer',
      interviewDate: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
      hoursSinceInterview: 55,
      escalateToTALeader: true,
      recruiters: 'Libin',
    },
    createdAt: new Date().toISOString(),
  },
];

// Module 3: Referral Follow-up - Not reviewed or no next action
const REFERRAL_ALERTS: MockAlert[] = [
  {
    id: 'referral-1',
    type: 'referral',
    severity: 'warning',
    payload: {
      subType: 'not_reviewed',
      candidateName: 'Ilankumaran',
      jobTitle: 'UX Designer',
      daysSinceReferral: 4,
      currentStage: 'Application Review',
      referrerId: 5001,
      recruiters: 'Derek David',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'referral-2',
    type: 'referral',
    severity: 'warning',
    payload: {
      subType: 'no_next_action',
      candidateName: 'Chandraj',
      jobTitle: 'Backend Engineer',
      daysSinceReferral: 6,
      currentStage: 'Phone Interview',
      referrerId: 5002,
      recruiters: 'Iniya',
    },
    createdAt: new Date().toISOString(),
  },
];

// Jobs
const MOCK_JOBS: MockJob[] = [
  { id: 1001, title: 'Senior Software Engineer', status: 'open', department: 'Engineering', updatedAt: new Date().toISOString() },
  { id: 1002, title: 'Product Manager', status: 'open', department: 'Product', updatedAt: new Date().toISOString() },
  { id: 1003, title: 'Data Analyst', status: 'open', department: 'Analytics', updatedAt: new Date().toISOString() },
  { id: 1004, title: 'DevOps Engineer', status: 'open', department: 'Engineering', updatedAt: new Date().toISOString() },
  { id: 1005, title: 'Frontend Engineer', status: 'open', department: 'Engineering', updatedAt: new Date().toISOString() },
];

// All alerts combined
const ALL_MOCK_ALERTS: MockAlert[] = [...STALLED_ALERTS, ...SCORECARD_ALERTS, ...REFERRAL_ALERTS];

// LLM Providers (for settings)
const MOCK_PROVIDERS: MockProvider[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'], pricing: 'Paid', speed: 'Medium', quality: 'Excellent', requiresApiKey: true, freeOption: false },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'], pricing: 'Free tier available', speed: 'Fast', quality: 'Excellent', requiresApiKey: true, freeOption: true },
  { id: 'claude', name: 'Anthropic Claude', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], pricing: 'Free tier available', speed: 'Fast', quality: 'Excellent', requiresApiKey: true, freeOption: true },
  { id: 'groq', name: 'Groq', models: ['mixtral-8x7b', 'llama2-70b'], pricing: 'Free', speed: 'Very Fast', quality: 'Good', requiresApiKey: true, freeOption: true },
  { id: 'ollama', name: 'Ollama (Local)', models: ['llama2', 'mistral', 'codellama'], pricing: 'Free (Local)', speed: 'Depends on hardware', quality: 'Good', requiresApiKey: false, freeOption: true },
];

/** Check if mock mode is enabled (env or default when no API) */
export function useMockMode(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  }
  return process.env.NEXT_PUBLIC_USE_MOCK === 'true' || sessionStorage.getItem('ta-agent-mock') === '1';
}

export function setMockMode(enabled: boolean) {
  if (typeof window !== 'undefined') {
    return enabled ? sessionStorage.setItem('ta-agent-mock', '1') : sessionStorage.removeItem('ta-agent-mock');
  }
}

/** API responses matching backend shape */
export const mockApi = {
  getAlerts: (type?: string) => {
    const filtered = type ? ALL_MOCK_ALERTS.filter((a) => a.type === type) : ALL_MOCK_ALERTS;
    return { success: true, data: filtered };
  },

  refreshAlerts: () => {
    // Simulate refresh - return same data (or could add slight variation)
    return { success: true, message: 'Alerts refreshed (mock)', count: ALL_MOCK_ALERTS.length };
  },

  getJobs: () => ({
    success: true,
    data: MOCK_JOBS,
  }),

  getSettingsProviders: () => ({
    success: true,
    data: MOCK_PROVIDERS,
  }),

  getSettingsLlm: () => ({
    success: true,
    data: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: '***preview',
      temperature: 0.7,
    },
  }),

  getSettingsGreenhouse: () => ({
    success: true,
    data: { configured: false, masked: undefined },
  }),

  postSettingsGreenhouse: () => ({
    success: true,
    message: 'Greenhouse API key saved (mock)',
  }),

  postSettingsGreenhouseTest: () => ({
    success: true,
    message: 'Greenhouse connected (mock)',
  }),

  postSettingsLlm: () => ({
    success: true,
    message: 'Settings saved (mock)',
  }),

  postSettingsLlmTest: () => ({
    success: true,
    message: 'Connection successful (mock)',
  }),
};
