import { Router } from 'express';
import { getGreenhouseService } from '../services/greenhouse.factory';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const greenhouse = getGreenhouseService();
    const data = await greenhouse.getJobs('open');
    res.json({
      success: true,
      data: data.map((j) => ({
        id: j.id,
        title: j.name,
        status: j.status,
        department: j.department?.name,
        updatedAt: j.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

export default router;
