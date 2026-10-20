import { pool, insertRows, query, one, tx } from '../db';
import { generate, AS_OF } from './generate';

export const SEED_VERSION = '2026-10-19.1';

/** Insert order respects foreign keys. */
export const TABLES = [
  'postal_codes', 'adjusters', 'customers', 'vehicles', 'policies', 'policy_coverages', 'policy_vehicles', 'drivers', 'vendors', 'claims',
  'coverage_verifications', 'claim_notes', 'claim_events', 'work_orders', 'payment_methods', 'payments', 'refunds',
] as const;

export async function isSeeded(): Promise<boolean> {
  const row = await one(`SELECT value FROM app_meta WHERE key = 'seed_version'`);
  return !!row;
}

export async function seed(): Promise<Record<string, number>> {
  const ds = generate();
  const counts: Record<string, number> = {};
  await tx(async (db) => {
    for (const t of TABLES) {
      await insertRows(db, t, (ds as any)[t]);
      counts[t] = (ds as any)[t].length;
    }
    for (const [seq, value] of Object.entries(ds.sequences)) await db.query(`SELECT setval($1, $2, true)`, [seq, value]);
    await db.query(
      `INSERT INTO app_meta (key, value) VALUES ('seed_version', $1), ('seed_as_of', $2), ('seeded_at', now()::text)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [SEED_VERSION, AS_OF.toISOString()],
    );
  });
  return counts;
}

/** Drops all data (not the schema) and re-seeds. Used by the admin reset endpoint for lab resets. */
export async function reset(): Promise<Record<string, number>> {
  await query(`TRUNCATE ${[...TABLES, 'idempotency_keys', 'app_meta'].join(', ')} RESTART IDENTITY CASCADE`);
  return seed();
}

export async function ensureSeeded(): Promise<void> {
  if (await isSeeded()) {
    console.log('[seed] database already seeded');
    return;
  }
  const hasData = await one(`SELECT 1 FROM customers LIMIT 1`);
  if (hasData) {
    console.log('[seed] customers exist but no seed marker; leaving data untouched');
    return;
  }
  const counts = await seed();
  console.log('[seed] seeded', counts);
}

export { pool };
