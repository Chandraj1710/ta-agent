import { Router } from 'express';
import { createTAAgent } from '../agents/ta-agent.graph';
import * as store from '../store';

const router = Router();

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
    const agent = createTAAgent();
    const result = await agent.run();
    const alerts = result.alerts || [];
    store.setAlerts(alerts.map((a) => ({ type: a.type, severity: a.severity, payload: a.payload })));

    res.json({
      success: true,
      message: 'Alerts refreshed',
      count: alerts.length,
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
