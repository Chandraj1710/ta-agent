'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertPageLayout } from '@/components/alert-page-layout';
import { api } from '@/lib/api';
import { AlertFiltersUI } from '@/components/alert-filters';
import { type AlertFilters, applyFilters } from '@/lib/filters';

interface Alert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default function ScorecardAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts('scorecard');
      setAlerts(data.success ? data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = applyFilters(alerts, filters);

  return (
    <AlertPageLayout
      title="Module 2: Scorecard Accountability"
      description="Interviewers who haven't submitted scorecards within 24h of interview"
      icon={FileCheck}
      iconColor="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
    >
      {!loading && alerts.length > 0 && (
        <Card className="mb-4 border-slate-200/80 dark:border-slate-700">
          <CardContent className="pt-4">
            <AlertFiltersUI
              alerts={alerts}
              filters={filters}
              onFiltersChange={setFilters}
              typeFilter="scorecard"
            />
          </CardContent>
        </Card>
      )}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              {alerts.length === 0
                ? 'No scorecard alerts. Run a refresh to sync.'
                : 'No alerts match your filters. Try adjusting filters.'}
            </p>
            <Link href="/" className="mt-4">
              <Button variant="outline" size="sm" className="transition-all duration-200 hover:scale-[1.02]">
                Refresh alerts from dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Interviewer
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Candidate
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Job
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recruiters
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Interview Date
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hours Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <AnimatePresence mode="popLayout">
                  {filteredAlerts.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {String(a.payload.interviewerName || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.candidateName || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.jobTitle || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.recruiters || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.interviewDate || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {String(a.payload.hoursSinceInterview ?? '-')}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AlertPageLayout>
  );
}
