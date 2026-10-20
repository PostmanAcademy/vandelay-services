import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Return DATE columns as 'YYYY-MM-DD' strings and NUMERIC as JS numbers.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

// RDS (Postgres 15+) requires TLS. POSTGRES_SSL=true encrypts the connection; the RDS CA is not pinned
// because the database is only reachable inside the VPC.
const ssl = process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

export const pool = new pg.Pool({
  ssl,
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  database: process.env.POSTGRES_DB ?? 'postgres',
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  max: parseInt(process.env.POSTGRES_POOL_SIZE ?? '10', 10),
});

// Idle clients emit 'error' when Postgres restarts (e.g. platform maintenance). Without a listener
// Node treats that as fatal and the whole server crashes; log it and let the pool reconnect instead.
pool.on('error', (err) => console.error(`[db] idle client error (pool will reconnect): ${err.message}`));

export type Db = pg.Pool | pg.PoolClient;

export async function query<T = any>(text: string, params: unknown[] = [], db: Db = pool): Promise<T[]> {
  const res = await db.query(text, params as any[]);
  return res.rows as T[];
}

export async function one<T = any>(text: string, params: unknown[] = [], db: Db = pool): Promise<T | undefined> {
  return (await query<T>(text, params, db))[0];
}

export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function nextId(seq: string, db: Db = pool): Promise<number> {
  const row = await one<{ id: number }>(`SELECT nextval($1) AS id`, [seq], db);
  return Number(row!.id);
}

export async function waitForDb(attempts = 30): Promise<void> {
  for (let i = 1; ; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`[db] waiting for Postgres (${i}/${attempts}): ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

/**
 * Creates POSTGRES_DB when it doesn't exist. Opt-in with POSTGRES_CREATE_DB=true, for hosts such as
 * a shared RDS instance where the application database isn't provisioned ahead of time.
 */
export async function ensureDatabase(attempts = 30): Promise<void> {
  if (process.env.POSTGRES_CREATE_DB !== 'true') return;
  const name = process.env.POSTGRES_DB ?? 'postgres';
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(name)) throw new Error(`POSTGRES_DB "${name}" must be lowercase letters, digits, or underscores.`);
  for (let i = 1; ; i++) {
    const admin = new pg.Client({
      ssl,
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      database: 'postgres',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    });
    admin.on('error', () => {});
    try {
      await admin.connect();
      const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (!exists.rowCount) {
        try {
          await admin.query(`CREATE DATABASE ${name}`);
          console.log(`[db] created database ${name}`);
        } catch (err) {
          if ((err as { code?: string }).code !== '42P04') throw err; // already created by a concurrent start
        }
      }
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`[db] waiting to create database (${i}/${attempts}): ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      await admin.end().catch(() => {});
    }
  }
}

export async function migrate(): Promise<void> {
  const sql = readFileSync(join(import.meta.dir, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
}

/** Inserts rows (objects keyed by column name) in batches. */
export async function insertRows(db: Db, table: string, rows: Record<string, unknown>[], batch = 200): Promise<void> {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  for (let i = 0; i < rows.length; i += batch) {
    const chunk = rows.slice(i, i + batch);
    const params: unknown[] = [];
    const values = chunk.map((row) => {
      const ph = cols.map((c) => {
        const v = row[c];
        params.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
        return `$${params.length}`;
      });
      return `(${ph.join(', ')})`;
    });
    await db.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES ${values.join(', ')}`, params as any[]);
  }
}
