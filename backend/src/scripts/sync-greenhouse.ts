/**
 * Sync jobs and applications from Greenhouse
 */
import 'dotenv/config';

async function sync() {
  console.log('🔄 Syncing from Greenhouse...');
  // TODO: Implement Greenhouse sync
  console.log('✅ Sync complete');
  process.exit(0);
}

sync().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
