/**
 * Alert store - uses in-memory when DATABASE_URL is not set.
 * No database required to run the TA Agent.
 */

export interface StoredAlert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const memoryAlerts: StoredAlert[] = [];

export function getAlerts(type?: string): StoredAlert[] {
  const list = [...memoryAlerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (type) return list.filter((a) => a.type === type);
  return list;
}

export function setAlerts(alerts: Array<{ type: string; severity: string; payload: Record<string, unknown> }>): void {
  memoryAlerts.length = 0;
  for (const a of alerts) {
    memoryAlerts.push({
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: a.type,
      severity: a.severity,
      payload: a.payload,
      createdAt: new Date().toISOString(),
    });
  }
}
