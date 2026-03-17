import { pgTable, uuid, text, varchar, jsonb, integer, timestamp, boolean, bigint } from 'drizzle-orm/pg-core';

// Jobs synced from Greenhouse (id = Greenhouse job id)
export const jobs = pgTable('jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }),
  status: varchar('status', { length: 50 }),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Applications synced from Greenhouse (id = Greenhouse application id)
export const applications = pgTable('applications', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  jobId: bigint('job_id', { mode: 'number' }).references(() => jobs.id).notNull(),
  candidateId: bigint('candidate_id', { mode: 'number' }).notNull(),
  stageId: bigint('stage_id', { mode: 'number' }),
  stageName: varchar('stage_name', { length: 100 }),
  enteredAt: timestamp('entered_at'),
  status: varchar('status', { length: 50 }),
  referrerId: bigint('referrer_id', { mode: 'number' }),
  sourceId: bigint('source_id', { mode: 'number' }),
  recruiterId: bigint('recruiter_id', { mode: 'number' }),
  hiringManagerId: bigint('hiring_manager_id', { mode: 'number' }),
  rawData: jsonb('raw_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Generated alerts
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // stalled, scorecard, referral
  severity: varchar('severity', { length: 20 }).notNull(), // warning, critical
  payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Configurable stage SLAs (business days)
export const slaConfig = pgTable('sla_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  stageName: varchar('stage_name', { length: 100 }).notNull().unique(),
  businessDays: integer('business_days').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
