'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, FileCheck, Users, Settings, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-500/50',
  },
  {
    type: 'scorecard' as const,
    href: '/alerts/scorecards',
    title: 'Scorecard Accountability',
    description: 'Missing scorecards 24h+ after interview',
    icon: FileCheck,
    color: 'blue',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-500/50',
  },
  {
    type: 'referral' as const,
    href: '/alerts/referrals',
    title: 'Referral Follow-up',
    description: 'Referrals not reviewed or no next action',
    icon: Users,
    color: 'emerald',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-500/50',
  },
];

export default function Home() {
  const [counts, setCounts] = useState<AlertCounts>({ stalled: 0, scorecard: 0, referral: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const stalled = data.data.filter((a: { type: string }) => a.type === 'stalled').length;
        const scorecard = data.data.filter((a: { type: string }) => a.type === 'scorecard').length;
        const referral = data.data.filter((a: { type: string }) => a.type === 'referral').length;
        setCounts({ stalled, scorecard, referral });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchCounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Hero gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]" />

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
          {moduleCards.map((card) => {
            const Icon = card.icon;
            const count = counts[card.type];

            return (
              <motion.div key={card.type} variants={item}>
                <Link href={card.href}>
                  <Card
                    className={cn(
                      'group relative overflow-hidden border-2 border-transparent transition-all duration-300 ease-in-out',
                      'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5',
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
                          card.color === 'amber' && 'text-amber-600',
                          card.color === 'blue' && 'text-blue-600',
                          card.color === 'emerald' && 'text-emerald-600'
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
