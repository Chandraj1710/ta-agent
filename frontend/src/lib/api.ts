/**
 * API client - uses real backend only (Greenhouse + TA Agent).
 * Set NEXT_PUBLIC_API_URL to your backend (default http://localhost:3001).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}

export function isUsingMockData(): boolean {
  return false;
}

export const api = {
  getAlerts: (type?: string) =>
    fetchApi<{ success: boolean; data: unknown[] }>(`/api/alerts${type ? `?type=${type}` : ''}`),

  refreshAlerts: () =>
    fetchApi<{ success: boolean; message?: string; count?: number }>('/api/alerts/refresh', {
      method: 'POST',
    }),

  getJobs: () =>
    fetchApi<{ success: boolean; data: unknown[] }>('/api/jobs'),

  getSettingsProviders: () =>
    fetchApi<{ success: boolean; data?: unknown[] }>('/api/settings/llm/providers'),

  getSettingsLlm: () =>
    fetchApi<{ success: boolean; provider?: string; model?: string }>('/api/settings/llm'),

  getSettingsGreenhouse: () =>
    fetchApi<{ success: boolean; hasKey?: boolean }>('/api/settings/greenhouse'),

  postSettingsGreenhouse: (body: { apiKey: string }) =>
    fetchApi<{ success: boolean; message?: string }>('/api/settings/greenhouse', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postSettingsGreenhouseTest: (body: { apiKey: string }) =>
    fetchApi<{ success: boolean; message?: string }>('/api/settings/greenhouse/test', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postSettingsLlm: (body: Record<string, unknown>) =>
    fetchApi<{ success: boolean; message?: string }>('/api/settings/llm', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postSettingsLlmTest: (body: Record<string, unknown>) =>
    fetchApi<{ success: boolean; message?: string; ok?: boolean }>('/api/settings/llm/test', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
