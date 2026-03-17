/**
 * Greenhouse Harvest API v1 Service
 * Auth: Basic Auth with api_key: (same as curl -u YOUR_API_KEY:)
 * Base: https://harvest.greenhouse.io/v1
 *
 * Endpoints used (per Harvest docs):
 *   GET /applications, /jobs, /candidates, /candidates/{id}
 *   GET /users, /scheduled_interviews, /scorecards
 *   GET /activity_feed, /offers, /rejection_reasons
 *   GET /jobs/{id}/stages
 */

const BASE_URL = 'https://harvest.greenhouse.io/v1/';

export interface GreenhouseJob {
  id: number;
  name: string;
  status: string;
  department?: { id: number; name: string };
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string; location?: { name?: string } }>;
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
  source?: { id: number; name: string; public_name?: string };
  credited_to?: { id: number; name: string };
  referrer?: { id: number; name: string };
  recruiter?: { id: number; name: string };
  location?: { address?: string } | null;
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

  private static readonly REQUEST_TIMEOUT_MS = 25_000;

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path.replace(/^\//, ''), BASE_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GreenhouseService.REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Greenhouse API error ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Greenhouse API timeout after ${GreenhouseService.REQUEST_TIMEOUT_MS / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

<<<<<<< HEAD
  private static readonly MAX_PAGES = 20;

  private async requestPaginated<T>(path: string, params?: Record<string, string>): Promise<T[]> {
=======
  private async requestPaginated<T>(path: string, params?: Record<string, string>, maxPages?: number): Promise<T[]> {
>>>>>>> f6491c2 (feat: stalled pipeline module, real API, docs, and tooling)
    const all: T[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
<<<<<<< HEAD
    while (hasMore && page <= GreenhouseService.MAX_PAGES) {
=======
    while (hasMore) {
      if (maxPages != null && page > maxPages) break;
>>>>>>> f6491c2 (feat: stalled pipeline module, real API, docs, and tooling)
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

  /** Single-page request for quick validation (max 1 page). */
  async requestOnePage<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    const p = { ...params, per_page: '5', page: '1' };
    const data = await this.request<T[]>(path, p);
    return Array.isArray(data) ? data : [];
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

  async getApplications(jobId?: number, status?: string, maxPages?: number): Promise<GreenhouseApplication[]> {
    const params: Record<string, string> = {};
    if (jobId) params.job_id = String(jobId);
    if (status) params.status = status;
    const data = await this.requestPaginated<GreenhouseApplication>('/applications', params, maxPages);
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

  /** Fetch job board sources. Use type.name === 'referrals' to identify referral source IDs. */
  async getSources(): Promise<Array<{ id: number; name: string; type?: { id: number; name: string } }>> {
    try {
      const data = await this.request<unknown>('/sources', { per_page: '500', page: '1' });
      return Array.isArray(data) ? data as Array<{ id: number; name: string; type?: { id: number; name: string } }> : [];
    } catch {
      return [];
    }
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

  /** GET /v1/users – recruiters / interviewers (paginated) */
  async getUsers(): Promise<unknown[]> {
    const data = await this.requestPaginated<unknown>('/users');
    return data;
  }

  /** GET /v1/scheduled_interviews – for scorecard / interview date logic (paginated) */
  async getScheduledInterviews(params?: Record<string, string>): Promise<unknown[]> {
    const data = await this.requestPaginated<unknown>('/scheduled_interviews', params ?? {});
    return data;
  }

  /** GET /v1/activity_feed – for "no activity" logic (paginated) */
  async getActivityFeed(params?: Record<string, string>): Promise<unknown[]> {
    const data = await this.requestPaginated<unknown>('/activity_feed', params ?? {});
    return data;
  }

  /** GET /v1/offers – for offer-related alerts (paginated) */
  async getOffers(params?: Record<string, string>): Promise<unknown[]> {
    const data = await this.requestPaginated<unknown>('/offers', params ?? {});
    return data;
  }

  /** GET /v1/rejection_reasons */
  async getRejectionReasons(): Promise<unknown[]> {
    try {
      const data = await this.request<unknown[] | { rejection_reasons?: unknown[] }>('/rejection_reasons');
      if (Array.isArray(data)) return data;
      return (data as { rejection_reasons?: unknown[] }).rejection_reasons || [];
    } catch {
      return [];
    }
  }
}
