import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobsRoutes from './routes/jobs.routes';
import alertsRoutes from './routes/alerts.routes';
import greenhouseRoutes from './routes/greenhouse.routes';
import settingsRoutes from './routes/settings.routes';
import agentRoutes from './routes/agent.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ta-agent-backend',
  });
});

// Routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/greenhouse', greenhouseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/agent', agentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 TA Ops Agent ready!`);
  if (!process.env.DATABASE_URL) {
    console.log(`📦 Running without database - alerts in memory, jobs from Greenhouse API`);
  }
});

export default app;
