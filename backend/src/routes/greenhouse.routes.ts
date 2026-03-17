import { Router } from 'express';
import { getGreenhouseService } from '../services/greenhouse.factory';
import { hasDatabase, getDb } from '../db';
import { jobs, applications } from '../db/schema';

const router = Router();

router.get('/candidates/:id', async (req, res) => {
  try {
    const { hasGreenhouseApiKey } = await import('../store/settings.store');
    if (!hasGreenhouseApiKey()) {
      return res.status(400).json({
        success: false,
        error: 'Greenhouse API key is not configured',
        details: 'Add GREENHOUSE_API_KEY to backend/.env or save via Settings',
      });
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ success: false, error: 'Invalid candidate ID' });
    }
    const greenhouse = getGreenhouseService();
    const candidate = await greenhouse.getCandidate(id);
    res.json({ success: true, data: candidate });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/test', async (req, res) => {
  try {
    const greenhouse = getGreenhouseService();
    const result = await greenhouse.testConnection();
    res.json({
      success: result.ok,
      message: result.ok ? 'Greenhouse connected' : (result.error || 'Connection failed'),
      error: result.error,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});

router.get('/sync', async (req, res) => {
  if (!hasDatabase()) {
    return res.status(400).json({
      success: false,
      error: 'Database required for sync. Set DATABASE_URL in .env (e.g. postgresql://postgres:postgres@localhost:5432/ta_agent)',
    });
  }
  try {
    const greenhouse = getGreenhouseService();
    const db = getDb()!;
    const [jobsData, applicationsData] = await Promise.all([
      greenhouse.getJobs('open'),
      greenhouse.getApplications(undefined, 'active'),
    ]);

    for (const j of jobsData) {
      await db
        .insert(jobs)
        .values({
          id: j.id,
          title: j.name,
          status: j.status,
          department: j.department?.name,
          lastActivityAt: j.updated_at ? new Date(j.updated_at) : null,
        })
        .onConflictDoUpdate({
          target: jobs.id,
          set: {
            title: j.name,
            status: j.status,
            department: j.department?.name,
            lastActivityAt: j.updated_at ? new Date(j.updated_at) : null,
            updatedAt: new Date(),
          },
        });
    }

    const jobIds = new Set(jobsData.map((j) => j.id));
    for (const a of applicationsData) {
      const jobId = a.job_id ?? (Array.isArray(a.jobs) && a.jobs[0] ? a.jobs[0].id : undefined);
      if (jobId == null || !jobIds.has(jobId)) continue;
      const enteredAt = a.last_activity_at || a.updated_at || a.applied_at;
      await db
        .insert(applications)
        .values({
          id: a.id,
          jobId,
          candidateId: a.candidate_id,
          stageName: a.current_stage?.name,
          status: a.status,
          referrerId: a.referrer?.id,
          enteredAt: enteredAt ? new Date(enteredAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: applications.id,
          set: {
            stageName: a.current_stage?.name,
            status: a.status,
            referrerId: a.referrer?.id,
            enteredAt: new Date(enteredAt || Date.now()),
            updatedAt: new Date(),
          },
        });
    }

    res.json({
      success: true,
      message: 'Sync completed',
      jobs: jobsData.length,
      applications: applicationsData.length,
    });
  } catch (error) {
    console.error('Error syncing Greenhouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
