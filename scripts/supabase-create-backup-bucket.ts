// One-shot: create the `booking-backups` Storage bucket if it doesn't exist.
// Idempotent — safe to re-run. Bucket is created PRIVATE; only the service
// role can read/write.
//
// Run:  npx tsx scripts/supabase-create-backup-bucket.ts

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'booking-backups';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Failed to list buckets:', listErr.message);
    process.exit(1);
  }

  if (existing?.some((b) => b.name === BUCKET)) {
    console.log(`✓ Bucket "${BUCKET}" already exists.`);
    return;
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50 MB cap
  });

  if (createErr) {
    console.error('Failed to create bucket:', createErr.message);
    process.exit(1);
  }

  console.log(`✓ Created private bucket "${BUCKET}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
