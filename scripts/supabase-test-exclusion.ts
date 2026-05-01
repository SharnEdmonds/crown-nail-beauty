/**
 * Smoke test: verifies the EXCLUDE constraint on booking_appointments rejects
 * overlapping pending/confirmed bookings for the same technician.
 *
 * Inserts a baseline booking, then attempts an overlapping insert that MUST
 * be rejected by Postgres. Cleans up after itself.
 *
 * Run:  npm run supabase:test-exclusion
 */

import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const DATABASE_URL = process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error('Missing SUPABASE_DB_URL. See scripts/supabase-apply-migrations.ts.');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const techId = `test-tech-${randomUUID()}`;
  const baselineStart = new Date('2099-01-01T10:00:00Z').toISOString();
  const baselineEnd = new Date('2099-01-01T11:00:00Z').toISOString();
  const overlapStart = new Date('2099-01-01T10:30:00Z').toISOString();
  const overlapEnd = new Date('2099-01-01T11:30:00Z').toISOString();
  const adjacentStart = new Date('2099-01-01T11:00:00Z').toISOString();
  const adjacentEnd = new Date('2099-01-01T12:00:00Z').toISOString();

  const baseInsert = (id: string, start: string, end: string) => ({
    text: `INSERT INTO booking_appointments
      (id, status, service_sanity_id, service_name_snapshot, service_price_cents_snapshot,
       service_duration_min_snapshot, deposit_cents_snapshot,
       technician_sanity_id, technician_name_snapshot,
       start_at, end_at, payment_method, source)
      VALUES ($1, 'confirmed', 'svc', 'Service', 6000, 60, 2000,
              $2, 'Tech', $3, $4, 'stripe', 'online')`,
    values: [id, techId, start, end] as Array<string>,
  });

  let exitCode = 0;
  const ids: string[] = [];

  try {
    // Insert baseline. Should succeed.
    const id1 = randomUUID();
    ids.push(id1);
    await client.query(baseInsert(id1, baselineStart, baselineEnd));
    console.log('✓ baseline insert succeeded');

    // Attempt overlapping insert. Should fail.
    const id2 = randomUUID();
    ids.push(id2);
    let rejected = false;
    try {
      await client.query(baseInsert(id2, overlapStart, overlapEnd));
    } catch (err) {
      const message = (err as Error).message;
      if (/exclusion constraint|conflicting key value/i.test(message)) {
        rejected = true;
        console.log(`✓ overlapping insert rejected: ${message.split('\n')[0]}`);
      } else {
        console.error(`✗ unexpected error: ${message}`);
        exitCode = 1;
      }
    }
    if (!rejected && exitCode === 0) {
      console.error('✗ overlapping insert was NOT rejected — exclusion constraint missing or broken');
      exitCode = 1;
    }

    // Adjacent (touching but not overlapping) insert should succeed.
    // tstzrange uses [start, end) by default, so [10:00, 11:00) and [11:00, 12:00) do NOT overlap.
    const id3 = randomUUID();
    ids.push(id3);
    try {
      await client.query(baseInsert(id3, adjacentStart, adjacentEnd));
      console.log('✓ adjacent (touching) insert succeeded');
    } catch (err) {
      console.error(`✗ adjacent insert failed unexpectedly: ${(err as Error).message}`);
      exitCode = 1;
    }
  } finally {
    // Clean up.
    if (ids.length > 0) {
      await client.query(
        `DELETE FROM booking_appointments WHERE id = ANY($1::uuid[])`,
        [ids],
      );
    }
    await client.end();
  }

  if (exitCode === 0) {
    console.log('\n✓ Exclusion constraint behaves correctly.');
  } else {
    console.error('\n✗ Exclusion constraint test FAILED.');
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
