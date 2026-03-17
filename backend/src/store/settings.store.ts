/**
 * In-memory store for Greenhouse API key (from UI).
 * Falls back to process.env.GREENHOUSE_API_KEY when not set.
 */

let greenhouseApiKey: string | null = null;

export function getGreenhouseApiKey(): string {
  return greenhouseApiKey || process.env.GREENHOUSE_API_KEY || '';
}

export function setGreenhouseApiKey(key: string): void {
  greenhouseApiKey = key || null;
}

export function hasGreenhouseApiKey(): boolean {
  return !!(greenhouseApiKey || process.env.GREENHOUSE_API_KEY);
}
