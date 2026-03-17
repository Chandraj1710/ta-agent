/**
 * Seed script for TA Agent
 * Seeds SLA config and any initial data
 */
import 'dotenv/config';

async function seed() {
  console.log('🌱 Seeding TA Agent database...');
  // TODO: Seed sla_config when schema is ready
  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
