/**
 * Greenhouse Harvest API v1 Service
 * Uses Basic Auth (api_key:) - matches working curl from Greenhouse docs
 * Base: https://harvest.greenhouse.io/v1
 */

const BASE_URL = 'https://harvest.greenhouse.io/v1/';

export interface GreenhouseJob {
  id: number;
  name: string;
  status: string;
  department?: { id: number; name: string };
  departments?: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
}

export interface GreenhouseApplication {
  id: number;
  candidate_id: number;
  job_id?: number;
  jobs?: Array<{ id: number; name: string }>;
  status: string;
  current_stage?: { id: number; name: string };
  source?: { id: number; name: string };
  credited_to?: { id: number; name: string };
  referrer?: { id: number; name: string };
  recruiter?: { id: number; name: string };
  created_at?: string;
  applied_at?: string;
  updated_at?: string;
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

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GREENHOUSE_API_KEY || '';
  }

  private getAuthHeader(): string {
    if (!this.apiKey) {
      throw new Error('Greenhouse API key is not configured');
    }
    return 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path.replace(/^\//, ''), BASE_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
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
    const data = await this.requestPaginated<GreenhouseJob>('/jobs', params);
    return data.map((j) => ({
      ...j,
      department: j.departments?.[0] ? { id: j.departments[0].id, name: j.departments[0].name } : undefined,
    }));
  }

  async getApplications(jobId?: number, status?: string): Promise<GreenhouseApplication[]> {
    const params: Record<string, string> = {};
    if (jobId) params.job_id = String(jobId);
    if (status) params.status = status;
    const data = await this.requestPaginated<GreenhouseApplication>('/applications', params);
    return data.map((a) => {
      const job = Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0] : null;
      const jobId = a.job_id ?? job?.id;
      return {
        ...a,
        job_id: jobId,
        referrer: a.referrer ?? a.credited_to,
      } as GreenhouseApplication & { job_id: number };
    });
  }

  async getCandidate(id: number): Promise<GreenhouseCandidate> {
    return this.request<GreenhouseCandidate>(`/candidates/${id}`);
  }

  async getScorecards(_params?: { created_after?: string }): Promise<GreenhouseScorecard[]> {
    try {
      const data = await this.request<GreenhouseScorecard[] | { scorecards?: GreenhouseScorecard[] }>('/scorecards');
      if (Array.isArray(data)) return data;
      return (data as { scorecards?: GreenhouseScorecard[] }).scorecards || [];
    } catch {
      return [];
    }
  }

  async getScheduledInterviews(_applicationId?: number): Promise<Array<{ id: number; application_id: number; start: string }>> {
    return [];
  }

  async getJobStages(jobId: number): Promise<GreenhouseJobStage[]> {
    try {
      const data = await this.request<GreenhouseJobStage[] | { stages?: GreenhouseJobStage[] }>(`/jobs/${jobId}/stages`);
      if (Array.isArray(data)) return data;
      return (data as { stages?: GreenhouseJobStage[] }).stages || [];
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.request<unknown>('/applications', { per_page: '1', page: '1' });
      return { ok: true };
    } catch (err1) {
      try {
        await this.request<unknown>('/jobs', { per_page: '1', page: '1' });
        return { ok: true };
      } catch {
        const msg = err1 instanceof Error ? err1.message : String(err1);
        return { ok: false, error: msg };
      }
    }
  }
}
