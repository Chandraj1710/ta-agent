/**
 * Alert filters - manual filter entry based on alert data structure
 */

export interface AlertFilters {
  type?: 'stalled' | 'scorecard' | 'referral';
  severity?: 'warning' | 'critical';
  recruiter?: string;
  candidateName?: string;
  jobTitle?: string;
  stage?: string;
  subType?: string;
  interviewerName?: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Extract unique filter options from alerts for dropdowns */
export function extractFilterOptions(alerts: Alert[]) {
  const recruiters = new Set<string>();
  const candidates = new Set<string>();
  const jobTitles = new Set<string>();
  const stages = new Set<string>();
  const subTypes = new Set<string>();
  const interviewers = new Set<string>();

  for (const a of alerts) {
    const r = String(a.payload.recruiters ?? '').trim();
    if (r) recruiters.add(r);
    const c = String(a.payload.candidateName ?? '').trim();
    if (c) candidates.add(c);
    const j = String(a.payload.jobTitle ?? '').trim();
    if (j) jobTitles.add(j);
    const s = String(a.payload.currentStage ?? '').trim();
    if (s) stages.add(s);
    const st = String(a.payload.subType ?? '').trim();
    if (st) subTypes.add(st);
    const i = String(a.payload.interviewerName ?? '').trim();
    if (i) interviewers.add(i);
  }

  return {
    recruiters: [...recruiters].sort(),
    candidates: [...candidates].sort(),
    jobTitles: [...jobTitles].sort(),
    stages: [...stages].sort(),
    subTypes: [...subTypes].sort(),
    interviewers: [...interviewers].sort(),
  };
}

/** Apply filters to alerts (client-side) */
export function applyFilters(alerts: Alert[], filters: AlertFilters): Alert[] {
  return alerts.filter((a) => {
    if (filters.type && a.type !== filters.type) return false;
    if (filters.severity && a.severity !== filters.severity) return false;
    const recruiters = String(a.payload.recruiters ?? '').trim();
    if (filters.recruiter && recruiters !== filters.recruiter) return false;
    const candidateName = String(a.payload.candidateName ?? '').trim();
    if (filters.candidateName && candidateName !== filters.candidateName) return false;
    const jobTitle = String(a.payload.jobTitle ?? '').trim();
    if (filters.jobTitle && jobTitle !== filters.jobTitle) return false;
    const stage = String(a.payload.currentStage ?? '').trim();
    if (filters.stage && stage !== filters.stage) return false;
    const subType = String(a.payload.subType ?? '').trim();
    if (filters.subType && subType !== filters.subType) return false;
    const interviewerName = String(a.payload.interviewerName ?? '').trim();
    if (filters.interviewerName && interviewerName !== filters.interviewerName) return false;
    return true;
  });
}

/** Check if any filter is set */
export function hasActiveFilters(filters: AlertFilters): boolean {
  return !!(
    filters.type ||
    filters.severity ||
    filters.recruiter ||
    filters.candidateName ||
    filters.jobTitle ||
    filters.stage ||
    filters.subType ||
    filters.interviewerName
  );
}
