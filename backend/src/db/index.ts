/**
 * Database - only initialized when DATABASE_URL is set.
 * Run without DATABASE_URL: alerts use in-memory store, jobs fetch from Greenhouse API.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}
