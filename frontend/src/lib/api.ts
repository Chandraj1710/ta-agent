/**
 * API client with mock fallback - works without backend
 * Uses mock data when NEXT_PUBLIC_USE_MOCK=true or when API is unavailable
 */

import { mockApi, useMockMode } from './mock-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithFallback<T>(
  path: string,
  getMock: () => T,
  options?: RequestInit
): Promise<T> {
  const forceMock = useMockMode();
  if (forceMock) {
    return Promise.resolve(getMock());
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    const data = await res.json();
    if (res.ok) return data as T;
    throw new Error(data.error || 'Request failed');
  } catch (error) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ta-agent-mock', '1');
      window.dispatchEvent(new CustomEvent('ta-agent-mock-changed'));
    }
    return getMock();
  }
}

export function isUsingMockData(): boolean {
  return useMockMode();
}

export const api = {
  getAlerts: (type?: string) =>
    fetchWithFallback(`/api/alerts${type ? `?type=${type}` : ''}`, () => mockApi.getAlerts(type)),

  refreshAlerts: () =>
    fetchWithFallback('/api/alerts/refresh', () => mockApi.refreshAlerts(), { method: 'POST' }),

  getJobs: () => fetchWithFallback('/api/jobs', () => mockApi.getJobs()),

  getSettingsProviders: () =>
    fetchWithFallback('/api/settings/llm/providers', () => mockApi.getSettingsProviders()),

  getSettingsLlm: () =>
    fetchWithFallback('/api/settings/llm', () => mockApi.getSettingsLlm()),

  getSettingsGreenhouse: () =>
    fetchWithFallback('/api/settings/greenhouse', () => mockApi.getSettingsGreenhouse()),

  postSettingsGreenhouse: (body: { apiKey: string }) =>
    fetchWithFallback('/api/settings/greenhouse', () => mockApi.postSettingsGreenhouse(), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postSettingsGreenhouseTest: (body: { apiKey: string }) =>
    fetchWithFallback(
      '/api/settings/greenhouse/test',
      () => mockApi.postSettingsGreenhouseTest(),
      { method: 'POST', body: JSON.stringify(body) }
    ),

  postSettingsLlm: (body: Record<string, unknown>) =>
    fetchWithFallback('/api/settings/llm', () => mockApi.postSettingsLlm(), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postSettingsLlmTest: (body: Record<string, unknown>) =>
    fetchWithFallback('/api/settings/llm/test', () => mockApi.postSettingsLlmTest(), {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
