/**
 * Apply booking module migrations to the Supabase project referenced in .env.local.
 *
 * Usage:  npx tsx scripts/supabase-apply-migrations.ts
 *
 * Reads every .sql file in ./supabase/migrations in lexicographic order and executes it
 * via the Supabase service-role connection. Idempotent at the file level: each migration
 * should already use IF NOT EXISTS / CREATE OR REPLACE where appropriate.
 *
 * For real production schema management you'd use the Supabase CLI; this is a lightweight
 * bring-up script for the dev/staging cycle.
 */

import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

// Next.js convention: .env.local takes priority over .env.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const DATABASE_URL = process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error(
    '\nMissing SUPABASE_DB_URL. Get it from your Supabase project:\n' +
      '  Project Settings → Database → Connection string → "URI"\n' +
      '\nUse the SESSION POOLER (port 5432) — works on IPv4 networks. The direct\n' +
      'connection (db.<ref>.supabase.co) requires IPv6 and may fail to resolve.\n' +
      '\nAdd it to .env.local as SUPABASE_DB_URL=postgresql://postgres.<ref>:...@aws-0-<region>.pooler.supabase.com:5432/postgres\n',
  );
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations to apply.');
    return;
  }

  console.log(`Found ${files.length} migration(s). Applying…\n`);

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // Tracking table — skips files we've already run.
    await client.query(`
      CREATE TABLE IF NOT EXISTS _booking_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Bootstrap: if the booking_appointments table already exists but the migrations
    // tracker is empty, mark 0001 as already applied. Protects fresh clones against
    // re-running 0001 on a long-lived database.
    const { rows: bootstrapCheck } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'booking_appointments'
      ) AS exists`,
    );
    if (bootstrapCheck[0]?.exists) {
      await client.query(
        `INSERT INTO _booking_migrations (filename)
         VALUES ('0001_booking_init.sql') ON CONFLICT DO NOTHING`,
      );
    }

    const { rows: appliedRows } = await client.query<{ filename: string }>(
      'SELECT filename FROM _booking_migrations',
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    let runCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`▶ ${file}  (skipped — already applied)`);
        continue;
      }
      const path = join(MIGRATIONS_DIR, file);
      const sql = readFileSync(path, 'utf8');
      console.log(`▶ ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _booking_migrations (filename) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`  ✓ ok\n`);
        runCount += 1;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`  ✗ failed:`, (err as Error).message, '\n');
        throw err;
      }
    }
    console.log(
      runCount > 0
        ? `Applied ${runCount} migration(s).`
        : 'All migrations already applied.',
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
