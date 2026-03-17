'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, FileCheck, Users, Settings, RefreshCw, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { AlertFiltersUI } from '@/components/alert-filters';
import { type AlertFilters, applyFilters, hasActiveFilters } from '@/lib/filters';

interface AlertCounts {
  stalled: number;
  scorecard: number;
  referral: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const moduleCards = [
  {
    type: 'stalled' as const,
    href: '/alerts/stalled',
    title: 'Stalled Pipeline',
    description: 'Candidates over SLA, stale jobs, offers no response',
    icon: AlertTriangle,
    color: 'amber',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/50',
  },
  {
    type: 'scorecard' as const,
    href: '/alerts/scorecards',
    title: 'Scorecard Accountability',
    description: 'Missing scorecards 24h+ after interview',
    icon: FileCheck,
    color: 'blue',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderHover: 'hover:border-blue-500/50',
  },
  {
    type: 'referral' as const,
    href: '/alerts/referrals',
    title: 'Referral Follow-up',
    description: 'Referrals not reviewed or no next action',
    icon: Users,
    color: 'emerald',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
  },
];

interface Alert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default function Home() {
  const [counts, setCounts] = useState<AlertCounts>({ stalled: 0, scorecard: 0, referral: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [mode, setMode] = useState<'ai' | 'filters'>('ai');

  const autoRefreshDone = useRef(false);

  const filteredAlerts = hasActiveFilters(filters) ? applyFilters(alerts, filters) : alerts;
  const filteredCounts: AlertCounts = {
    stalled: filteredAlerts.filter((a) => a.type === 'stalled').length,
    scorecard: filteredAlerts.filter((a) => a.type === 'scorecard').length,
    referral: filteredAlerts.filter((a) => a.type === 'referral').length,
  };
  const displayCounts = hasActiveFilters(filters) ? filteredCounts : counts;

  useEffect(() => {
    fetchCounts();
  }, []);

  // Auto-refresh once when alerts are empty (agent hasn't run yet)
  useEffect(() => {
    if (loading || autoRefreshDone.current) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/alerts/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.agentHasRun === false && counts.stalled === 0 && counts.scorecard === 0 && counts.referral === 0) {
          autoRefreshDone.current = true;
          handleRefresh();
        }
      })
      .catch(() => {});
  }, [loading, counts.stalled, counts.scorecard, counts.referral]);

  const fetchCounts = async () => {
    try {
      const data = await api.getAlerts();
      if (data.success && Array.isArray(data.data)) {
        const list = data.data as Alert[];
        setAlerts(list);
        setCounts({
          stalled: list.filter((a) => a.type === 'stalled').length,
          scorecard: list.filter((a) => a.type === 'scorecard').length,
          referral: list.filter((a) => a.type === 'referral').length,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentQuery = async () => {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResponse(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const res = await fetch(`${apiUrl}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) {
        setQueryResponse(data.text);
        if (data.summary) {
          setCounts((c) => ({
            ...c,
            stalled: data.summary.stalled ?? c.stalled,
            scorecard: data.summary.scorecard ?? c.scorecard,
            referral: data.summary.referral ?? c.referral,
          }));
        }
      } else {
        setQueryResponse(`Error: ${data.details || data.error || 'Request failed'}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setQueryResponse('Request timed out. Try a simpler question.');
      } else {
        setQueryResponse(err instanceof Error ? err.message : 'Request failed');
      }
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      const res = await fetch(`${apiUrl}/api/alerts/refresh`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) {
        await fetchCounts();
      } else if (res.status === 409) {
        alert(data.hint || 'Refresh already in progress. Please wait.');
      } else {
        alert(data.details || data.error || 'Refresh failed');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        alert('Refresh timed out after 90 seconds. Greenhouse API may be slow or unreachable.');
      } else {
        console.error(err);
        alert('Refresh failed. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Hero gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pipeline Alerts
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground text-lg">
            Talent Acquisition pipeline alerts, scorecard accountability, and referral follow-up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="lg"
              className="gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Alerts'}
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="lg" className="gap-2 transition-all duration-200 hover:scale-[1.02]">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Toggle: AI Query or Manual Filters */}
          <motion.div variants={item} className="sm:col-span-2 lg:col-span-3">
            <div className="mb-3 flex rounded-lg border border-input bg-muted/30 dark:bg-muted/50 p-1 w-fit">
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'ai'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                AI Query
              </button>
              <button
                type="button"
                onClick={() => setMode('filters')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'filters'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Manual Filters
              </button>
            </div>

            {mode === 'ai' && (
              <Card className="border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white dark:border-indigo-800/50 dark:from-indigo-950/30 dark:to-slate-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ask the TA Agent</CardTitle>
                  <CardDescription>
                    Type a question or task. The agent will fetch pipeline data and use AI to answer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Show me stalled referrals, Who's in the offer stage?, Summarize pipeline alerts"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAgentQuery()}
                      className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={queryLoading}
                    />
                    <Button
                      onClick={handleAgentQuery}
                      disabled={queryLoading || !query.trim()}
                      className="gap-2"
                    >
                      <Send className={cn('h-4 w-4', queryLoading && 'animate-pulse')} />
                      {queryLoading ? 'Thinking...' : 'Ask'}
                    </Button>
                  </div>
                  {queryResponse && (
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                      {queryResponse}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {mode === 'filters' && (
              <Card className="border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Manual filters</CardTitle>
                  <CardDescription>
                    Filter alerts by recruiter, candidate, job, stage, and more. Options are derived from your data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertFiltersUI
                    alerts={alerts}
                    filters={filters}
                    onFiltersChange={setFilters}
                    className="pt-1"
                  />
                  {hasActiveFilters(filters) && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Showing {filteredAlerts.length} of {alerts.length} alerts
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {moduleCards.map((card) => {
            const Icon = card.icon;
            const count = displayCounts[card.type];

            return (
              <motion.div key={card.type} variants={item}>
                <Link href={card.href}>
                  <Card
                    className={cn(
                      'group relative overflow-hidden border-2 border-transparent transition-all duration-300 ease-in-out',
                      'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5',
                      card.borderHover
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.iconBg)}>
                          <Icon className={cn('h-5 w-5', card.iconColor)} />
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                      </div>
                      <CardTitle className="mt-4 text-lg font-semibold">{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      ) : (
                        <span className={cn(
                          'text-2xl font-bold',
                          card.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                          card.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                          card.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {count}
                        </span>
                      )}
                      <span className="ml-1 text-sm text-muted-foreground">alerts</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
