import { Router } from 'express';
import { db } from '../db';
import { alerts } from '../db/schema';
import { createTAAgent } from '../agents/ta-agent.graph';
import { eq, desc } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = db.select().from(alerts).orderBy(desc(alerts.createdAt));
    const rows = await query;
    let data = rows;
    if (typeof type === 'string' && type) {
      data = rows.filter((r) => r.type === type);
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const agent = createTAAgent();
    const result = await agent.run();

    await db.delete(alerts);
    for (const a of result.alerts || []) {
      await db.insert(alerts).values({
        type: a.type,
        severity: a.severity,
        payload: a.payload as Record<string, unknown>,
      });
    }

    res.json({
      success: true,
      message: 'Alerts refreshed',
      count: result.alerts?.length ?? 0,
    });
  } catch (error) {
    console.error('Error refreshing alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
