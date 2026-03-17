import { Router } from 'express';
import { getGreenhouseService } from '../services/greenhouse.factory';
import { hasDatabase, getDb } from '../db';
import { jobs, applications } from '../db/schema';

const router = Router();

router.get('/test', async (req, res) => {
  try {
    const greenhouse = getGreenhouseService();
    const ok = await greenhouse.testConnection();
    res.json({ success: ok, message: ok ? 'Greenhouse connected' : 'Connection failed' });
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
      if (!jobIds.has(a.job_id)) continue;
      await db
        .insert(applications)
        .values({
          id: a.id,
          jobId: a.job_id,
          candidateId: a.candidate_id,
          stageName: a.current_stage?.name,
          status: a.status,
          referrerId: a.referrer?.id,
          enteredAt: a.last_activity_at ? new Date(a.last_activity_at) : new Date(a.updated_at),
        })
        .onConflictDoUpdate({
          target: applications.id,
          set: {
            stageName: a.current_stage?.name,
            status: a.status,
            referrerId: a.referrer?.id,
            enteredAt: a.last_activity_at ? new Date(a.last_activity_at) : new Date(a.updated_at),
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
