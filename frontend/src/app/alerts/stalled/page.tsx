'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertPageLayout } from '@/components/alert-page-layout';
import { api } from '@/lib/api';
import { CandidateDetailModal } from '@/components/candidate-detail-modal';
import { AlertFiltersUI } from '@/components/alert-filters';
import { type AlertFilters, applyFilters } from '@/lib/filters';

interface Alert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default function StalledAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts('stalled');
      setAlerts(data.success ? data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = applyFilters(alerts, filters);

  const getSubTypeBadge = (subType: string) => {
    switch (subType) {
      case 'stale_job':
        return <Badge variant="secondary">Stale Job</Badge>;
      case 'offer_no_response':
        return <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">Offer No Response</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Stage SLA</Badge>;
    }
  };

  return (
    <AlertPageLayout
      title="Module 1: Stalled Pipeline Alerts"
      description="Candidates over SLA, stale jobs, offers with no response"
      icon={AlertTriangle}
      iconColor="bg-amber-500/10 text-amber-600"
    >
      {!loading && alerts.length > 0 && (
        <Card className="mb-4 border-slate-200/80">
          <CardContent className="pt-4">
            <AlertFiltersUI
              alerts={alerts}
              filters={filters}
              onFiltersChange={setFilters}
              typeFilter="stalled"
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
                ? 'No stalled pipeline alerts. Run a refresh to sync.'
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
        <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Candidate
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Job
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Stage
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Days
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recruiters
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <AnimatePresence mode="popLayout">
                  {filteredAlerts.map((a, i) => {
                    const candidateId = a.payload.candidateId as number | undefined;
                    const isClickable = typeof candidateId === 'number';
                    return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`transition-colors ${isClickable ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30'}`}
                      onClick={() => isClickable && setSelectedAlert(a)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {String(a.payload.candidateName || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.jobTitle || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.currentStage || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {String(a.payload.daysInStage ?? a.payload.daysSinceOffer ?? a.payload.daysSinceActivity ?? '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {String(a.payload.recruiters || '-')}
                      </td>
                      <td className="px-6 py-4">
                        {getSubTypeBadge(String(a.payload.subType || 'stage_sla'))}
                      </td>
                    </motion.tr>
                  );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CandidateDetailModal
        candidateId={selectedAlert?.payload?.candidateId as number | undefined ?? null}
        alertPayload={selectedAlert?.payload ?? {}}
        onClose={() => setSelectedAlert(null)}
      />
    </AlertPageLayout>
  );
}
