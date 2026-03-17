import { Router } from 'express';
import { createTAAgent } from '../agents/ta-agent.graph';
import { getGreenhouseService } from '../services/greenhouse.factory';
import * as store from '../store';

const router = Router();
let refreshInProgress = false;

router.get('/debug/refresh-flow', async (req, res) => {
  try {
    const { hasGreenhouseApiKey } = await import('../store/settings.store');
    if (!hasGreenhouseApiKey()) {
      return res.status(400).json({
        success: false,
        error: 'Greenhouse API key is not configured',
      });
    }
    const greenhouse = getGreenhouseService();
    const [jobs, applications, scorecards] = await Promise.all([
      greenhouse.getJobs('open'),
      greenhouse.getApplications(undefined, 'active'),
      greenhouse.getScorecards({}),
    ]);

    const appWithDetails: Array<{
      id: number;
      jobId: number;
      referrerId?: number;
      sourceId?: number;
      sourceName?: string;
      stageName?: string;
      enteredAt?: string;
    }> = [];
    for (const a of applications) {
      const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined);
      if (jobId == null) continue;
      const referrerId = a.referrer?.id ?? a.credited_to?.id ?? (a as { credited_to_id?: number }).credited_to_id;
      const sourceName = (a.source?.public_name ?? a.source?.name ?? '').toLowerCase();
      const sourceId = a.source?.id;
      appWithDetails.push({
        id: a.id,
        jobId,
        referrerId,
        sourceId,
        sourceName,
        stageName: a.current_stage?.name,
        enteredAt: a.last_activity_at || a.updated_at,
      });
    }

    const withReferrerId = appWithDetails.filter((a) => a.referrerId != null);
    const withReferralSource = appWithDetails.filter((a) => (a.sourceName ?? '').includes('referral'));
    const isReferral = (app: typeof appWithDetails[0]) =>
      app.referrerId != null || (app.sourceName ?? '').includes('referral');
    const referrals = appWithDetails.filter(isReferral);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const afterCutoff = referrals.filter((r) => {
      const d = r.enteredAt ? new Date(r.enteredAt) : null;
      return !d || d >= cutoff;
    });

    const sampleRaw = applications.slice(0, 3).map((a) => ({
      id: a.id,
      source: a.source,
      credited_to: a.credited_to,
      referrer: a.referrer,
    }));

    res.json({
      success: true,
      data: {
        jobsCount: jobs.length,
        applicationsCount: applications.length,
        scorecardsCount: scorecards.length,
        appWithDetailsCount: appWithDetails.length,
        withReferrerId: withReferrerId.length,
        withReferralSource: withReferralSource.length,
        referralsCount: referrals.length,
        afterCutoffCount: afterCutoff.length,
        sourceNames: [...new Set(appWithDetails.map((a) => a.sourceName || '(none)'))],
        sampleRaw,
        sampleProcessed: appWithDetails.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Debug refresh-flow error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/debug/referrals', async (req, res) => {
  try {
    const { hasGreenhouseApiKey } = await import('../store/settings.store');
    if (!hasGreenhouseApiKey()) {
      return res.status(400).json({
        success: false,
        error: 'Greenhouse API key is not configured',
        hint: 'Add GREENHOUSE_API_KEY to backend/.env or save your key via Settings page (Settings → Greenhouse API Key)',
      });
    }
    const greenhouse = getGreenhouseService();
    const applications = await greenhouse.getApplications(undefined, 'active');
    const sample = applications.slice(0, 20).map((a) => ({
      id: a.id,
      candidate_id: a.candidate_id,
      source: a.source,
      credited_to: a.credited_to,
      referrer: a.referrer,
      current_stage: a.current_stage?.name,
      status: a.status,
    }));
    const withReferrer = applications.filter((a) => {
      const rid = a.referrer?.id ?? a.credited_to?.id ?? (a as { credited_to_id?: number }).credited_to_id;
      return rid != null;
    });
    const withReferralSource = applications.filter((a) => {
      const sn = ((a.source?.public_name ?? a.source?.name) ?? '').toLowerCase();
      return sn.includes('referral');
    });
    const sourceNames = [...new Set(applications.map((a) => {
      const n = a.source?.public_name ?? a.source?.name ?? '';
      return n || '(none)';
    }))];
    const sources = await greenhouse.getSources();
    const referralSourceIds = sources.filter((s) => (s.type?.name ?? '').toLowerCase() === 'referrals').map((s) => s.id);
    const withReferralSourceId = applications.filter((a) => a.source?.id != null && referralSourceIds.includes(a.source.id));
    res.json({
      success: true,
      data: {
        totalApplications: applications.length,
        withReferrerOrCreditedTo: withReferrer.length,
        withReferralSource: withReferralSource.length,
        withReferralSourceId: withReferralSourceId.length,
        referralSourceIds,
        sourceNames,
        sample,
      },
    });
  } catch (error) {
    console.error('Debug referrals error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/status', (req, res) => {
  const all = store.getAlerts();
  const lastRefresh = store.getLastRefreshAt();
  const byType = { stalled: 0, scorecard: 0, referral: 0 };
  for (const a of all) {
    if (a.type in byType) byType[a.type as keyof typeof byType]++;
  }
  res.json({
    success: true,
    data: {
      totalAlerts: all.length,
      byType,
      lastRefreshAt: lastRefresh?.toISOString() ?? null,
      agentHasRun: lastRefresh !== null,
    },
  });
});

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const data = store.getAlerts(typeof type === 'string' ? type : undefined);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    if (refreshInProgress) {
      return res.status(409).json({
        success: false,
        error: 'Refresh already in progress',
        hint: 'Wait for the current refresh to complete before trying again.',
      });
    }
    const { hasGreenhouseApiKey } = await import('../store/settings.store');
    if (!hasGreenhouseApiKey()) {
      return res.status(400).json({
        success: false,
        error: 'Greenhouse API key is not configured',
        hint: 'Add GREENHOUSE_API_KEY to backend/.env or save your key via Settings → Greenhouse API Key',
      });
    }
    refreshInProgress = true;
    try {
      console.log('[Alerts] POST /refresh - starting agent run...');
      const agent = createTAAgent();
      const result = await agent.run();
      const alerts = result.alerts || [];
      const byType = { stalled: 0, scorecard: 0, referral: 0 };
      for (const a of alerts) {
        if (a.type in byType) byType[a.type as keyof typeof byType]++;
      }
      store.setAlerts(alerts.map((a) => ({ type: a.type, severity: a.severity, payload: a.payload })));
      console.log('[Alerts] Refresh complete:', { total: alerts.length, byType });

      res.json({
        success: true,
        message: 'Alerts refreshed',
        count: alerts.length,
        byType,
      });
    } finally {
      refreshInProgress = false;
    }
  } catch (error) {
    console.error('[Alerts] Refresh failed:', error);
    refreshInProgress = false;
    res.status(500).json({
      success: false,
      error: 'Failed to refresh alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
