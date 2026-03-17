'use client';

import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type AlertFilters,
  type Alert,
  extractFilterOptions,
  hasActiveFilters,
} from '@/lib/filters';
import { cn } from '@/lib/utils';

interface AlertFiltersProps {
  alerts: Alert[];
  filters: AlertFilters;
  onFiltersChange: (f: AlertFilters) => void;
  /** When set, hide type filter (e.g. on stalled/scorecards/referrals pages) */
  typeFilter?: 'stalled' | 'scorecard' | 'referral';
  className?: string;
}

export function AlertFiltersUI({
  alerts,
  filters,
  onFiltersChange,
  typeFilter,
  className,
}: AlertFiltersProps) {
  const options = extractFilterOptions(alerts);
  const active = hasActiveFilters(filters);

  const update = (key: keyof AlertFilters, value: string | undefined) => {
    const next = { ...filters };
    if (value) next[key] = value as never;
    else delete next[key];
    onFiltersChange(next);
  };

  const clearAll = () => onFiltersChange({});

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Manual filters
        </span>
        {active && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!typeFilter && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
            <select
              value={filters.type ?? ''}
              onChange={(e) => update('type', e.target.value || undefined)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All</option>
              <option value="stalled">Stalled</option>
              <option value="scorecard">Scorecard</option>
              <option value="referral">Referral</option>
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Severity</label>
          <select
            value={filters.severity ?? ''}
            onChange={(e) => update('severity', e.target.value || undefined)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">All</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Recruiter</label>
          <select
            value={filters.recruiter ?? ''}
            onChange={(e) => update('recruiter', e.target.value || undefined)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">All</option>
            {options.recruiters.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Candidate</label>
          <select
            value={filters.candidateName ?? ''}
            onChange={(e) => update('candidateName', e.target.value || undefined)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">All</option>
            {options.candidates.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Job</label>
          <select
            value={filters.jobTitle ?? ''}
            onChange={(e) => update('jobTitle', e.target.value || undefined)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">All</option>
            {options.jobTitles.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        {options.stages.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Stage</label>
            <select
              value={filters.stage ?? ''}
              onChange={(e) => update('stage', e.target.value || undefined)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All</option>
              {options.stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        {options.interviewers.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Interviewer</label>
            <select
              value={filters.interviewerName ?? ''}
              onChange={(e) => update('interviewerName', e.target.value || undefined)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All</option>
              {options.interviewers.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        )}
        {options.subTypes.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sub-type</label>
            <select
              value={filters.subType ?? ''}
              onChange={(e) => update('subType', e.target.value || undefined)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All</option>
              {options.subTypes.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
