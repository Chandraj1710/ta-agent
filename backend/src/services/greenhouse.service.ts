/**
 * Greenhouse Harvest API v3 Service
 * Fetches jobs, applications, candidates, scorecards, and job stages
 */

const BASE_URL = 'https://harvest.greenhouse.io/v3';
const AUTH_URL = 'https://harvest.greenhouse.io/auth/token';

export interface GreenhouseJob {
  id: number;
  name: string;
  status: string;
  department?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface GreenhouseApplication {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  current_stage?: { id: number; name: string };
  source?: { id: number; name: string };
  referrer?: { id: number; name: string };
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
}

export interface GreenhouseCandidate {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface GreenhouseScorecard {
  id: number;
  application_id: number;
  submitted_by?: { id: number; name: string };
  interviewed_at?: string;
  created_at: string;
}

export interface GreenhouseJobStage {
  id: number;
  name: string;
  job_id: number;
}

export default class GreenhouseService {
  private apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GREENHOUSE_API_KEY || '';
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    if (!this.apiKey) {
      throw new Error('GREENHOUSE_API_KEY is not configured');
    }
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Greenhouse auth failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { access_token: string; expires_at?: string };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 3600000);
    return this.accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.getToken();
    const url = new URL(path, BASE_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Greenhouse API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  private async requestPaginated<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      const p = { ...params, per_page: String(perPage), page: String(page) };
      const data = await this.request<T[]>(path, p);
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }
      all.push(...data);
      hasMore = data.length === perPage;
      page++;
    }
    return all;
  }

  async getJobs(status?: string): Promise<GreenhouseJob[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    return this.requestPaginated<GreenhouseJob>('/jobs', params);
  }

  async getApplications(jobId?: number, status?: string): Promise<GreenhouseApplication[]> {
    const params: Record<string, string> = {};
    if (jobId) params.job_id = String(jobId);
    if (status) params.status = status;
    return this.requestPaginated<GreenhouseApplication>('/applications', params);
  }

  async getCandidate(id: number): Promise<GreenhouseCandidate> {
    return this.request<GreenhouseCandidate>(`/candidates/${id}`);
  }

  async getScorecards(params?: { created_after?: string }): Promise<GreenhouseScorecard[]> {
    const q: Record<string, string> = {};
    if (params?.created_after) q.created_after = params.created_after;
    return this.requestPaginated<GreenhouseScorecard>('/scorecards', q);
  }

  async getJobStages(jobId: number): Promise<GreenhouseJobStage[]> {
    try {
      const data = await this.request<{ job_stages?: GreenhouseJobStage[] } | GreenhouseJobStage[]>(`/jobs/${jobId}`);
      if (Array.isArray(data)) return data;
      return (data as { job_stages?: GreenhouseJobStage[] }).job_stages || [];
    } catch {
      return [];
    }
  }

  async getScheduledInterviews(applicationId?: number): Promise<Array<{ id: number; application_id: number; start: string; interviewers?: Array<{ id: number; name: string }> }>> {
    try {
      const path = applicationId ? `/applications/${applicationId}/scheduled_interviews` : '/scheduled_interviews';
      const data = await this.request<Array<{ id: number; application_id: number; start: string; interviewers?: Array<{ id: number; name: string }> }>>(path);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getToken();
      await this.request<unknown>('/jobs', { per_page: '1' });
      return true;
    } catch {
      return false;
    }
  }
}
