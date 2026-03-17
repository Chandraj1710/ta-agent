# Debug Additions (removed from code; re-add locally if needed)

These endpoints were added for verifying Greenhouse data and alert generation. They are **not** in the committed code. Copy back into `backend/src/routes/alerts.routes.ts` when debugging.

---

## 1. GET `/api/alerts/verify-greenhouse`

**Purpose:** Check raw Greenhouse data without running the agent. One page of applications; confirms API connection and that stage/dates exist.

**Add to router (after `const router = Router();`):**

```ts
import { getGreenhouseService } from '../services/greenhouse.factory';

/** Verify raw Greenhouse data: fetch one page of applications and return stage + dates (no agent, no alert logic) */
router.get('/verify-greenhouse', async (req, res) => {
  try {
    const greenhouse = getGreenhouseService();
    const [jobs, applicationsRaw] = await Promise.all([
      greenhouse.getJobs('open'),
      greenhouse.requestOnePage<{ id: number; job_id?: number; current_stage?: { name: string }; last_activity_at?: string; updated_at?: string; status: string }>('/applications', { status: 'active' }),
    ]);
    const sample = applicationsRaw.slice(0, 10).map((a) => ({
      id: a.id,
      job_id: a.job_id,
      status: a.status,
      stage: a.current_stage?.name ?? null,
      last_activity_at: a.last_activity_at ?? null,
      updated_at: a.updated_at ?? null,
      usedAsEnteredAt: a.last_activity_at || a.updated_at,
    }));
    res.json({
      success: true,
      source: 'Greenhouse Harvest API (real)',
      jobsCount: jobs.length,
      applicationsOnFirstPage: applicationsRaw.length,
      sampleApplications: sample,
      note: 'If stage + usedAsEnteredAt are old (e.g. months ago), our stalled logic correctly flags them.',
    });
  } catch (error) {
    console.error('Verify Greenhouse error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

**Usage:** `curl -s http://localhost:3001/api/alerts/verify-greenhouse`

---

## 2. GET `/api/alerts/debug`

**Purpose:** Run the full agent once and return counts + sample (no store update). Use to verify data flow and alert counts without affecting the dashboard.

**Add to router:**

```ts
/** Debug: verify Greenhouse data and alert generation (jobs/apps counts, sample dates, alert counts) */
router.get('/debug', async (req, res) => {
  try {
    const agent = createTAAgent();
    const result = await agent.run();
    const jobs = result.jobs || [];
    const applications = result.applications || [];
    const alerts = result.alerts || [];
    const stalled = alerts.filter((a) => a.type === 'stalled');

    const sampleApp = applications[0];
    const sampleJob = jobs[0];

    res.json({
      success: true,
      greenhouse: {
        jobsCount: jobs.length,
        applicationsCount: applications.length,
        sampleApplication: sampleApp
          ? {
              id: sampleApp.id,
              stageName: sampleApp.stageName,
              enteredAt: sampleApp.enteredAt,
              jobId: sampleApp.jobId,
            }
          : null,
        sampleJob: sampleJob
          ? { id: sampleJob.id, title: sampleJob.title, lastActivityAt: sampleJob.lastActivityAt }
          : null,
      },
      alerts: {
        total: alerts.length,
        stalled: stalled.length,
        scorecard: alerts.filter((a) => a.type === 'scorecard').length,
        referral: alerts.filter((a) => a.type === 'referral').length,
        sampleStalledPayloads: stalled.slice(0, 3).map((a) => a.payload),
      },
    });
  } catch (error) {
    console.error('Alerts debug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

**Usage:** `curl -s -m 60 http://localhost:3001/api/alerts/debug`

---

## Script (kept in repo)

- `backend/src/scripts/validate-greenhouse.ts` – `npm run validate-greenhouse` to hit all Greenhouse endpoints (single page each). Kept as a dev/validation script; not a REST endpoint.
