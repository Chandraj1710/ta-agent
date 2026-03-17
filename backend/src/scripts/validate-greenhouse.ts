/**
 * Validate Greenhouse API: hit all endpoints (per Harvest docs) and report data received.
 * Auth matches: curl -u YOUR_API_KEY:
 * Run: npm run validate-greenhouse
 */
import 'dotenv/config';
import GreenhouseService from '../services/greenhouse.service';

async function validate() {
  const apiKey = process.env.GREENHOUSE_API_KEY;
  if (!apiKey) {
    console.error('❌ GREENHOUSE_API_KEY not set in .env');
    process.exit(1);
  }
  console.log('✅ GREENHOUSE_API_KEY is set');
  console.log('   (Auth: Basic api_key: same as curl -u YOUR_API_KEY:)\n');

  const greenhouse = new GreenhouseService(apiKey);

  const endpoints: Array<{ name: string; fn: () => Promise<unknown[]> }> = [
    { name: '1. GET /applications', fn: () => greenhouse.requestOnePage('/applications', { status: 'active' }) },
    { name: '2. GET /candidates', fn: () => greenhouse.requestOnePage('/candidates') },
    { name: '3. GET /jobs', fn: () => greenhouse.requestOnePage('/jobs') },
    { name: '4. GET /users', fn: () => greenhouse.requestOnePage('/users') },
    { name: '5. GET /scheduled_interviews', fn: () => greenhouse.requestOnePage('/scheduled_interviews') },
    { name: '6. GET /scorecards', fn: () => greenhouse.requestOnePage('/scorecards') },
    { name: '7. GET /activity_feed', fn: () => greenhouse.requestOnePage('/activity_feed') },
    { name: '8. GET /offers', fn: () => greenhouse.requestOnePage('/offers') },
    { name: '9. GET /rejection_reasons', fn: () => greenhouse.getRejectionReasons().then((r) => (Array.isArray(r) ? r : [])) },
  ];

  console.log('--- Hitting all endpoints (single page each) ---');
  const results: Array<{ name: string; ok: boolean; count: number; error?: string }> = [];
  for (const { name, fn } of endpoints) {
    try {
      const data = await fn();
      const count = Array.isArray(data) ? data.length : 0;
      results.push({ name, ok: true, count });
      console.log(`  ✅ ${name} → ${count} item(s)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name, ok: false, count: 0, error: msg });
      console.log(`  ❌ ${name} → ${msg}`);
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n--- Summary: ${okCount}/${results.length} endpoints OK ---`);

  // Stalled pipeline needs: jobs + applications (with stage, last_activity_at)
  console.log('\n--- Stalled pipeline data (full fetch, may be slow) ---');
  let jobs: Awaited<ReturnType<GreenhouseService['getJobs']>> = [];
  let applications: Awaited<ReturnType<GreenhouseService['getApplications']>> = [];
  try {
    jobs = await greenhouse.getJobs('open');
    console.log(`  Jobs (open): ${jobs.length}`);
  } catch (e) {
    console.log('  Jobs error:', e instanceof Error ? e.message : e);
  }
  try {
    applications = await greenhouse.getApplications(undefined, 'active');
    console.log(`  Applications (active): ${applications.length}`);
  } catch (e) {
    console.log('  Applications error:', e instanceof Error ? e.message : e);
  }

  const withStage = applications.filter((a) => a.current_stage?.name);
  const withActivity = applications.filter((a) => a.last_activity_at || a.updated_at);
  console.log(`  Applications with stage: ${withStage.length}/${applications.length}`);
  console.log(`  Applications with last_activity_at or updated_at: ${withActivity.length}/${applications.length}`);
  if (jobs.length >= 1 && applications.length >= 1) {
    console.log('  ✅ Enough data to validate stalled pipeline.');
  } else {
    console.log('  ⚠️ Add jobs/applications in Greenhouse to test stalled alerts.');
  }

  if (applications.length > 0) {
    const sample = applications.slice(0, 2).map((a) => ({
      id: a.id,
      job_id: a.job_id,
      current_stage: a.current_stage?.name,
      last_activity_at: a.last_activity_at ?? a.updated_at,
    }));
    console.log('  Sample applications:', JSON.stringify(sample, null, 2));
  }

  console.log('\n✅ Validation complete.');
}

validate().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
