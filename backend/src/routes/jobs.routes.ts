import { Router } from 'express';
import GreenhouseService from '../services/greenhouse.service';
import { db } from '../db';
import { jobs } from '../db/schema';

const router = Router();
const greenhouse = new GreenhouseService();

router.get('/', async (req, res) => {
  try {
    const { source } = req.query;
    if (source === 'greenhouse') {
      const data = await greenhouse.getJobs('open');
      return res.json({
        success: true,
        data: data.map((j) => ({
          id: j.id,
          title: j.name,
          status: j.status,
          department: j.department?.name,
          updatedAt: j.updated_at,
        })),
      });
    }
    const rows = await db.select().from(jobs);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

export default router;
