# Railway cron services

The booking module has four cron-triggered endpoints. They all live as HTTP
routes under `/api/admin/*-cron` and authenticate via a shared `X-Cron-Secret`
header. Any external scheduler that can hit a URL hourly with a header can run
them — Railway's built-in cron services are the recommended choice.

| Endpoint                              | Schedule       | What it does                                                |
|---------------------------------------|----------------|-------------------------------------------------------------|
| `/api/admin/expire-pending-cron`      | hourly         | Marks `pending_payment` rows older than 1h as `expired`.    |
| `/api/admin/backup-csv-cron`          | nightly (3am)  | Dumps bookings + customers to Supabase Storage as CSV.      |
| `/api/admin/review-email-cron`        | hourly         | Sends "how was Sarah?" emails 2 days after appointment.     |
| `/api/admin/sms-reminder-cron`        | hourly         | Sends SMS reminders 24h ahead. Skips disabled or no-phone.  |

## Required env var

Generate a single `CRON_SECRET` (32+ random bytes) and set it on **both** the
`web` service and every cron service that calls it. The endpoints reject any
request whose `X-Cron-Secret` header doesn't exactly match.

Generate one:
```bash
openssl rand -hex 32
# or in Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Setup in Railway

For each cron job, create a separate Railway service (in the same project as
the `web` service):

1. Railway dashboard → your project → **+ New** → **Empty Service**.
2. Name it e.g. `cron-expire-pending`.
3. Settings → **Cron schedule**: pick a cron expression (e.g. `0 * * * *` = top
   of every hour).
4. Settings → **Start command**: a curl that hits the web service. Example:
   ```
   curl -fsS -H "X-Cron-Secret: $CRON_SECRET" "$WEB_URL/api/admin/expire-pending-cron"
   ```
5. Variables: copy `CRON_SECRET` from the web service. Add `WEB_URL` set to
   your `web` service's public URL (e.g. `https://crown-nail-beauty.up.railway.app`).
6. Repeat for each of the four endpoints with the appropriate schedule:
   - `expire-pending-cron` — `0 * * * *`
   - `backup-csv-cron` — `0 15 * * *` (3am NZT ≈ 15:00 UTC)
   - `review-email-cron` — `0 * * * *`
   - `sms-reminder-cron` — `0 * * * *`

The `-fsS` flags on curl mean: silent on success, show errors on failure (so
cron run output isn't noisy in steady state but tells you what broke).

## Backup bucket setup

The CSV backup uploads to Supabase Storage. Create the bucket once:

1. Supabase dashboard → Storage → **Create new bucket**.
2. Name: `booking-backups`.
3. Public bucket: **OFF** (private — only service-role can read).
4. File size limit: 50 MB is plenty.

The backup endpoint uses `upsert: true` so re-running on the same day overwrites
the file. CSVs accumulate one per day under `bookings/YYYY-MM-DD.csv` and
`customers/YYYY-MM-DD.csv`.

## Restoring from a backup

Manual process (we don't ship an automated restore):

1. Download the CSV from Supabase Storage.
2. Use `psql` `\copy` to import. Example:
   ```sql
   \copy booking_customers FROM 'customers/2026-04-30.csv' CSV HEADER
   ```
3. Make sure the target table is empty or you'll hit primary key conflicts.

Restoring `booking_appointments` will fail the exclusion constraint if any
rows overlap — for a fresh restore into an empty schema this is fine.

## Local testing

You don't need cron locally. Just hit the endpoint manually:

```bash
curl -H "X-Cron-Secret: $(grep ^CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3002/api/admin/expire-pending-cron
```
