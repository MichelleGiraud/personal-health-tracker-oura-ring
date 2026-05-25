# Personal Health Tracker (Oura Ring)

This repository contains a small monorepo for an Oura-based health dashboard:

- `apps/web`: Next.js app
- `services/analytics`: FastAPI ML service
- `infra/postgres`: local Postgres bootstrap
- `packages/db`: schema assets
- `docs`: architecture and structure notes

If you only read one file first, read this one.

## Start Here

- Architecture: [docs/architecture.md](/Users/michelle.giraud/Github/personal-health-tracker-oura-ring/docs/architecture.md)
- Folder map: [docs/project-structure.md](/Users/michelle.giraud/Github/personal-health-tracker-oura-ring/docs/project-structure.md)

## Repo Layout

```text
personal-health-tracker-oura-ring/
├── apps/
│   └── web/                  Next.js app, API routes, queue, worker
├── docs/
│   ├── architecture.md       System diagrams and request flows
│   └── project-structure.md  Folder guide
├── infra/
│   └── postgres/             Local database bootstrap SQL
├── packages/
│   └── db/                   Shared DB schema assets
├── services/
│   └── analytics/            FastAPI analytics service
├── docker-compose.yml        Local Postgres + Redis
├── package.json              Root helper scripts
└── README.md                 Main entrypoint
```

## What Runs

- PostgreSQL in Docker on `localhost:5433`
- Redis in Docker on `localhost:6379`
- Next.js on `localhost:3000`
- FastAPI analytics on `localhost:8000`
- BullMQ worker as a separate Node process

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop running
- Python environment for `services/analytics`

## First-Time Setup

1. Install web dependencies.

```bash
npm --prefix apps/web install
```

2. Create `apps/web/.env.local`.

```env
DATABASE_URL=postgresql://app:app@localhost:5433/oura
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
OURA_REDIRECT_URI=http://localhost:3000/api/auth/oura/callback
REDIS_URL=redis://127.0.0.1:6379
ANALYTICS_API_URL=http://localhost:8000
```

3. Create `services/analytics/.env`.

```env
DATABASE_URL=postgresql://app:app@localhost:5433/oura
HOST=0.0.0.0
PORT=8000
```

## Run Locally

Start infrastructure:

```bash
npm run db:up
```

Start the web app:

```bash
npm run web:dev
```

Start the background worker:

```bash
npm run web:worker
```

Start the analytics service:

```bash
cd services/analytics
source .venv/bin/activate
uvicorn main:app --reload
```

Open:

- `http://localhost:3000`

## Root Commands

```bash
npm run db:up
npm run db:down
npm run db:logs
npm run web:dev
npm run web:build
npm run web:worker
```

## Common Flows

### OAuth + Sync

1. Open the Oura OAuth URL in the browser.

```text
https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/oura/callback&scope=daily%20heartrate
```

2. The callback stores tokens and queues a background sync job.
3. The worker fetches Oura data and stores it in Postgres.
4. The worker asks the analytics service to retrain the user model.

### Manual Sync

```text
http://localhost:3000/api/oura/sync?days=7
```

That endpoint now queues work instead of blocking the request.

## Database Connection

Use this connection string locally:

```text
postgresql://app:app@127.0.0.1:5433/oura
```

## Engineering Improvements

### Structured logging with Pino
All logs in the background worker are now structured JSON instead of plain text strings. Each log line includes searchable fields (`userId`, `jobId`, `durationMs`) and a short event name (`sync_started`, `sync_completed`, `job_failed`). In local dev, output is pretty-printed with colors. In production, raw JSON is emitted for log aggregators.

- Logger config: `apps/web/src/lib/logger.ts`
- Usage: `apps/web/src/workers/syncWorker.ts`

### Required environment variables
Replaced silent `|| "http://localhost:8000"` fallbacks with a `requireEnv()` helper that crashes immediately with a clear error if a variable is missing. This prevents silent misconfigurations in deployed environments.

- Helper: `apps/web/src/lib/env.ts`
- Reference for required variables: `apps/web/.env.example`

## Testing

### Web App (`apps/web`)

Tests are written with [Vitest](https://vitest.dev/) and live in `apps/web/src/lib/test/oura.test.ts`.

#### Run Tests

```bash
cd apps/web
npx vitest run
```

#### Test Coverage

**`shiftDayForward`**

| Test | Description |
|------|-------------|
| shifts a normal date forward by one day | `"2024-01-15"` → `"2024-01-16"` |
| rolls over to the next month correctly | `"2024-01-31"` → `"2024-02-01"` |
| handles leap year February correctly | `"2024-02-28"` → `"2024-02-29"` (leap), `"2023-02-28"` → `"2023-03-01"` (non-leap) |
| rolls over to the next year correctly | `"2024-12-31"` → `"2025-01-01"` |

**`normalizeNumber`**

| Test | Description |
|------|-------------|
| returns a valid number unchanged | `42`, `0`, `-5` pass through |
| returns null for non-numbers | strings, `null`, `undefined` → `null` |
| returns null for non-finite values | `Infinity`, `NaN` → `null` |

**`normalizePositiveNumber`**

| Test | Description |
|------|-------------|
| returns a positive number | `5` → `5` |
| returns null for zero | `0` → `null` |
| returns null for negative numbers | `-1` → `null` |
| returns null for non-numbers | `null` → `null` |

**`buildSummaryPatch`**

| Test | Description |
|------|-------------|
| extracts sleep fields from a sleep row | Maps `total_sleep_duration`, `efficiency`, `average_hrv`, `lowest_heart_rate` |
| returns empty patch for a nap row | Rows with `type: "nap"` are ignored |
| extracts readiness_score from daily_readiness row | Maps `score` → `readiness_score` |
| extracts steps from daily_activity row | Maps `steps` and `score` → `activity_score` |

---

### Analytics Service (`services/analytics`)

Tests are written with [pytest](https://docs.pytest.org/) and live in `services/analytics/test_helpers.py`.

#### Setup

```bash
cd services/analytics
pip3 install -r requirements.txt
```

#### Run Tests

```bash
python3 -m pytest test_helpers.py -v
```

#### Test Coverage

| Test | Function | Description |
|------|----------|-------------|
| `test_label_readiness_optimal` | `label_readiness` | Score ≥ 85 → `"Optimal"` |
| `test_label_readiness_good` | `label_readiness` | Score 70–84 → `"Good"` |
| `test_label_readiness_fair` | `label_readiness` | Score 55–69 → `"Fair"` |
| `test_label_readiness_low` | `label_readiness` | Score ≤ 54 → `"Low"` |
| `test_classify_recovery_day_ready` | `classify_recovery_day` | Score ≥ 75 → `"Ready"` |
| `test_classify_recovery_day_moderate` | `classify_recovery_day` | Score 60–74 → `"Moderate"` |
| `test_classify_recovery_day_recovery` | `classify_recovery_day` | Score ≤ 59 → `"Recovery"` |

## Troubleshooting

- If the DB connection fails, verify that the port is `5433`, not `5432`.
- If the worker is not processing jobs, verify that Redis is running and `REDIS_URL` matches `localhost:6379`.
- If the dashboard loads but prediction fails, verify that the analytics service is running on `localhost:8000`.
- If `next dev` complains about a lock file, stop the old Next process and restart it.
