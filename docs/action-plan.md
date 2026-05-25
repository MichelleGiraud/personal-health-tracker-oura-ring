# Engineering Action Plan — Month 1

A prioritized checklist of concrete improvements. Each item includes a plain-English explanation of the problem, exact steps, and the code to write.

---

## Quick reference

| Week | Task | File(s) |
|------|------|---------|
| 1 | Replace console.log with Pino structured logging | `src/workers/syncWorker.ts` |
| 1 | Replace hardcoded localhost with required env vars | `src/app/helpers/ai.server.ts`, `.env.local` |
| 2 | Write unit tests for 5 pure functions | new `src/lib/__tests__/oura.test.ts` |
| 2 | Fix predict-readiness to use saved model instead of retraining | `services/analytics/main.py` |
| 3 | Write one ADR for FastAPI/Next.js architecture split | new `docs/adr-001-analytics-service.md` |
| 3 | Add OAuth state parameter validation | `src/app/api/auth/oura/callback/route.ts` |
| 4 | Batch the N+1 inserts in saveDailySummary | `src/lib/oura.ts` |

---

## Week 1, Task 1 — Structured logging with Pino

### The problem in plain English

Right now every log line in `syncWorker.ts` is a plain text string:

```
Starting background Oura sync task for user: abc-123 (30 days)
Job 42 completed successfully!
```

This looks fine locally. In production it's useless because:
- You can't search by `userId` or `jobId` — it's buried in a sentence
- You can't tell how long a sync took
- Every log tool (GCP, Datadog, grep) expects key-value pairs, not sentences
- You can't set log level (show only errors, not info) without code changes

Structured logging means every line is JSON:
```json
{"level":"info","time":1716912345678,"msg":"sync_completed","userId":"abc-123","jobId":"42","durationMs":1240}
```
Now it's searchable, filterable, and parseable by any tool.

### Step 1 — Install Pino

```bash
cd apps/web
npm install pino
npm install --save-dev @types/pino pino-pretty
```

`pino` is the logger. `pino-pretty` is just for readable output during local development.

### Step 2 — Create a logger file

Create `apps/web/src/lib/logger.ts`:

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
```

What this does:
- In local dev (`NODE_ENV` not set to `production`): prints human-readable colored output
- In production: outputs raw JSON (what log aggregators need)
- `LOG_LEVEL` env var lets you switch to `debug` without code changes

### Step 3 — Replace console.log in syncWorker.ts

Open `src/workers/syncWorker.ts`. Replace the entire file:

```typescript
import { Worker } from "bullmq";
import IORedis from "ioredis";

import { syncOuraForUser } from "../lib/oura";
import type { OuraSyncJobData } from "../lib/queue";
import { logger } from "../lib/logger";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const analyticsApiUrl = process.env.ANALYTICS_API_URL || "http://localhost:8000";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const syncWorker = new Worker<OuraSyncJobData>(
  "OuraSyncJobs",
  async (job) => {
    const { userId, days } = job.data;
    const startMs = Date.now();

    logger.info({ userId, jobId: job.id, days }, "sync_started");

    const result = await syncOuraForUser(userId, days);

    logger.info(
      { userId, jobId: job.id, durationMs: Date.now() - startMs, counts: result.counts },
      "sync_completed"
    );

    try {
      const trainResponse = await fetch(`${analyticsApiUrl}/train-model?user_id=${userId}`, {
        method: "POST",
      });
      if (!trainResponse.ok) {
        const body = await trainResponse.text();
        logger.warn({ userId, status: trainResponse.status, body }, "model_retrain_failed");
      } else {
        logger.info({ userId }, "model_retrain_triggered");
      }
    } catch (trainErr) {
      const msg = trainErr instanceof Error ? trainErr.message : String(trainErr);
      logger.warn({ userId, err: msg }, "model_retrain_skipped_service_unreachable");
    }

    return result;
  },
  { connection }
);

syncWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "job_completed");
});

syncWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message, stack: err.stack }, "job_failed");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "worker_shutting_down");
  await syncWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
```

Key differences:
- Every log call passes an **object first** (`{ userId, jobId, durationMs }`), then a string message. The object becomes searchable fields.
- `durationMs` tells you how long each sync took — invaluable for spotting slowdowns
- `counts` tells you how many records came back per source

### How to verify it works

```bash
cd apps/web
npm run worker:sync
```

You should see colored JSON-like output in the terminal. If you see it, you're done.

---

## Week 1, Task 2 — Replace hardcoded localhost with required env vars

### The problem in plain English

Two files have `http://localhost:8000` written directly in the code:

- `src/app/helpers/ai.server.ts` line 18
- `src/workers/syncWorker.ts` line 8

This means:
- If you ever deploy to any environment (Docker Compose, Cloud Run, a VPS), the URL needs to change — but you can't change it without editing code and redeploying
- The correct pattern is to put URLs in environment variables so you change them in config, not in code
- Worse: if the env var is missing, the current code falls back to localhost **silently**. You'd deploy and get empty predictions with no error message, not knowing why

The fix: crash loudly if the variable is missing, so you can't accidentally deploy with the wrong config.

### Step 1 — Add a helper that crashes on missing env vars

Create `apps/web/src/lib/env.ts`:

```typescript
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Add it to your .env.local file. See .env.example for reference.`
    );
  }
  return value;
}
```

This is deliberately loud. If `ANALYTICS_API_URL` is not set, the process will crash immediately with a clear error message instead of silently using the wrong URL.

### Step 2 — Fix ai.server.ts

Open `src/app/helpers/ai.server.ts`. Change line 18 from:

```typescript
// BEFORE
const predRes = await fetch(`http://localhost:8000/predict-readiness?user_id=${activeUserId}`, {
```

To:

```typescript
// AFTER
import { requireEnv } from "@/lib/env";

const analyticsApiUrl = requireEnv("ANALYTICS_API_URL");
const predRes = await fetch(`${analyticsApiUrl}/predict-readiness?user_id=${activeUserId}`, {
```

Place the `requireEnv` call and import at the top of the function (or top of the file).

### Step 3 — Fix syncWorker.ts

In `src/workers/syncWorker.ts`, the line:

```typescript
// BEFORE
const analyticsApiUrl = process.env.ANALYTICS_API_URL || "http://localhost:8000";
```

Change to:

```typescript
// AFTER
import { requireEnv } from "../lib/env";

const analyticsApiUrl = requireEnv("ANALYTICS_API_URL");
```

### Step 4 — Update your .env.local

Open `apps/web/.env.local` and add:

```bash
ANALYTICS_API_URL=http://localhost:8000
```

### Step 5 — Create a .env.example file

Create `apps/web/.env.example` (this file is committed to git — it documents what vars are needed without storing real secrets):

```bash
# Oura OAuth credentials (get from https://cloud.ouraring.com/oauth/applications)
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=
OURA_REDIRECT_URI=http://localhost:3000/api/auth/oura/callback

# Postgres connection string
DATABASE_URL=postgresql://app:app@localhost:5433/oura

# Redis connection string
REDIS_URL=redis://127.0.0.1:6379

# Analytics service URL (FastAPI)
ANALYTICS_API_URL=http://localhost:8000
```

### How to verify

Stop your Next.js dev server. Temporarily remove `ANALYTICS_API_URL` from `.env.local`. Restart. You should see a clear crash error:

```
Error: Missing required environment variable: ANALYTICS_API_URL
```

That's the correct behavior. Add it back and restart.

---

## Week 2, Task 3 — Unit tests for 5 pure functions

### The problem in plain English

A **pure function** is one that takes input and returns output with no side effects — it doesn't touch the database, make HTTP calls, or read from disk. Your codebase has several of these, and they are the easiest and most valuable things to test.

Right now, if `shiftDayForward` silently broke on a month boundary (e.g., turning March 31 into April 32), you'd have wrong dates in your database with no warning. A test would catch it in under a second.

The 5 functions to test:
1. `shiftDayForward` (oura.ts) — date math, has edge cases
2. `normalizeNumber` (oura.ts) — filters invalid values
3. `buildSummaryPatch` (oura.ts) — core data transformation logic
4. `label_readiness` (main.py) — score to label mapping
5. `classify_recovery_day` (main.py) — score to category mapping

### Step 1 — Install Vitest (TypeScript tests)

```bash
cd apps/web
npm install --save-dev vitest
```

Add to `apps/web/package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### Step 2 — Export the functions you want to test

The functions `shiftDayForward` and `normalizeNumber` are currently not exported from `oura.ts` (they're internal helpers). To test them, you need to export them.

In `src/lib/oura.ts`, change:

```typescript
// BEFORE
function shiftDayForward(dateStr: string): string {
function normalizeNumber(value: unknown): number | null {
function normalizePositiveNumber(value: unknown): number | null {
```

```typescript
// AFTER — add export keyword
export function shiftDayForward(dateStr: string): string {
export function normalizeNumber(value: unknown): number | null {
export function normalizePositiveNumber(value: unknown): number | null {
export function buildSummaryPatch(source: OuraDailySource, row: Record<string, unknown>): DailySummaryAccumulator {
```

Note: exporting internal helpers is fine for tests. It doesn't change any behavior.

### Step 3 — Create the test file

Create `apps/web/src/lib/__tests__/oura.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  shiftDayForward,
  normalizeNumber,
  normalizePositiveNumber,
  buildSummaryPatch,
} from "../oura";

// -------------------------------------------------------
// shiftDayForward
// -------------------------------------------------------
describe("shiftDayForward", () => {
  it("shifts a normal date forward by one day", () => {
    expect(shiftDayForward("2024-01-15")).toBe("2024-01-16");
  });

  it("rolls over to the next month correctly", () => {
    expect(shiftDayForward("2024-01-31")).toBe("2024-02-01");
  });

  it("handles leap year February correctly", () => {
    expect(shiftDayForward("2024-02-28")).toBe("2024-02-29"); // 2024 is a leap year
    expect(shiftDayForward("2023-02-28")).toBe("2023-03-01"); // 2023 is not
  });

  it("rolls over to the next year correctly", () => {
    expect(shiftDayForward("2024-12-31")).toBe("2025-01-01");
  });
});

// -------------------------------------------------------
// normalizeNumber
// -------------------------------------------------------
describe("normalizeNumber", () => {
  it("returns a valid number unchanged", () => {
    expect(normalizeNumber(42)).toBe(42);
    expect(normalizeNumber(0)).toBe(0);
    expect(normalizeNumber(-5)).toBe(-5);
  });

  it("returns null for non-numbers", () => {
    expect(normalizeNumber("42")).toBeNull();
    expect(normalizeNumber(null)).toBeNull();
    expect(normalizeNumber(undefined)).toBeNull();
  });

  it("returns null for non-finite values", () => {
    expect(normalizeNumber(Infinity)).toBeNull();
    expect(normalizeNumber(NaN)).toBeNull();
  });
});

// -------------------------------------------------------
// normalizePositiveNumber
// -------------------------------------------------------
describe("normalizePositiveNumber", () => {
  it("returns a positive number", () => {
    expect(normalizePositiveNumber(5)).toBe(5);
  });

  it("returns null for zero", () => {
    expect(normalizePositiveNumber(0)).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(normalizePositiveNumber(-1)).toBeNull();
  });

  it("returns null for non-numbers", () => {
    expect(normalizePositiveNumber(null)).toBeNull();
  });
});

// -------------------------------------------------------
// buildSummaryPatch
// -------------------------------------------------------
describe("buildSummaryPatch", () => {
  it("extracts sleep fields from a sleep row", () => {
    const row = {
      type: "long_sleep",
      total_sleep_duration: 28800,
      efficiency: 85,
      latency: 600,
      average_hrv: 45,
      lowest_heart_rate: 52,
      deep_sleep_duration: 7200,
      rem_sleep_duration: 5400,
      light_sleep_duration: 9000,
      awake_time: 1200,
    };
    const patch = buildSummaryPatch("sleep", row);
    expect(patch.sleep_total_seconds).toBe(28800);
    expect(patch.sleep_efficiency).toBe(85);
    expect(patch.hrv_avg_ms).toBe(45);
    expect(patch.resting_hr_bpm).toBe(52);
  });

  it("returns empty patch for a nap row", () => {
    const row = { type: "nap", total_sleep_duration: 1800 };
    const patch = buildSummaryPatch("sleep", row);
    expect(Object.keys(patch)).toHaveLength(0);
  });

  it("extracts readiness_score from daily_readiness row", () => {
    const row = { score: 78 };
    const patch = buildSummaryPatch("daily_readiness", row);
    expect(patch.readiness_score).toBe(78);
  });

  it("extracts steps from daily_activity row", () => {
    const row = { steps: 8500, score: 72 };
    const patch = buildSummaryPatch("daily_activity", row);
    expect(patch.steps).toBe(8500);
    expect(patch.activity_score).toBe(72);
  });
});
```

### Step 4 — Run the tests

```bash
cd apps/web
npm test
```

All tests should pass. If any fail, the test found a real edge case — investigate before moving on.

### Step 5 — Python tests for main.py

Create `services/analytics/test_helpers.py`:

```python
import pytest
from main import label_readiness, classify_recovery_day, build_prediction_confidence

# -------------------------------------------------------
# label_readiness
# -------------------------------------------------------
def test_label_readiness_optimal():
    assert label_readiness(90) == "Optimal"
    assert label_readiness(85) == "Optimal"

def test_label_readiness_good():
    assert label_readiness(84) == "Good"
    assert label_readiness(70) == "Good"

def test_label_readiness_fair():
    assert label_readiness(69) == "Fair"
    assert label_readiness(55) == "Fair"

def test_label_readiness_low():
    assert label_readiness(54) == "Low"
    assert label_readiness(0) == "Low"

# -------------------------------------------------------
# classify_recovery_day
# -------------------------------------------------------
def test_classify_recovery_day_ready():
    assert classify_recovery_day(80) == "Ready"
    assert classify_recovery_day(75) == "Ready"

def test_classify_recovery_day_moderate():
    assert classify_recovery_day(74) == "Moderate"
    assert classify_recovery_day(60) == "Moderate"

def test_classify_recovery_day_recovery():
    assert classify_recovery_day(59) == "Recovery"
    assert classify_recovery_day(0) == "Recovery"
```

Run with:

```bash
cd services/analytics
pip install pytest
pytest test_helpers.py -v
```

---

## Week 2, Task 4 — Fix predict-readiness to use the saved model

### The problem in plain English

Right now `GET /predict-readiness` does this on **every single request**:
1. Loads all your data from Postgres
2. Runs TimeSeriesSplit cross-validation on 4 models
3. Trains the best model from scratch
4. Uses it to make one prediction
5. Throws the trained model away

This means loading your dashboard triggers a full ML training run, every time. On 30 days of data this might take 1-2 seconds. On 90 days it'll be slower. On a real dataset it would be unacceptable.

The `POST /train-model` endpoint already exists to train and save the model to disk via joblib. But `predict-readiness` ignores that saved model entirely.

The fix: `predict-readiness` should just **load the saved model and predict**. The expensive training should only happen when explicitly triggered.

### Step 1 — Verify /train-model exists

Check if there is a `POST /train-model` endpoint in `main.py`. If it's missing, add it now (before fixing predict-readiness, because predict-readiness will depend on it).

Search `main.py` for `@app.post`. If you don't find `/train-model`, add this at the bottom of `main.py`:

```python
@app.post("/train-model")
def train_model(user_id: str):
    """
    Trains the best model for a user and saves it to disk.
    Called by the BullMQ sync worker after each data sync.
    """
    success = train_and_save_user_model(user_id)
    if not success:
        return {"status": "skipped", "reason": "insufficient_data"}
    return {"status": "trained", "user_id": user_id}
```

### Step 2 — Rewrite /predict-readiness to load from disk

Replace the existing `predict_readiness` function in `main.py`:

```python
@app.get("/predict-readiness")
def predict_readiness(user_id: str):
    """
    Loads a pre-trained model from disk and makes a prediction.
    If no model exists yet, triggers training first (first-run only).
    """
    model_path = os.path.join(MODEL_DIR, f"model_{user_id}.joblib")

    # First time: no model saved yet — train it now
    if not os.path.exists(model_path):
        success = train_and_save_user_model(user_id)
        if not success:
            return {
                "error": "Not enough data to predict. Sync at least 7 days of Oura data first."
            }

    # Load the saved model payload
    try:
        model_payload = joblib.load(model_path)
    except Exception as e:
        return {"error": f"Failed to load model: {str(e)}"}

    pipeline = model_payload["pipeline"]
    features = model_payload["features"]
    best_model_metrics = model_payload["metrics"]
    best_model_name = best_model_metrics["model"]

    # Load current data to build today's feature row
    df = load_user_data(user_id)
    if df.empty or len(df) < 2:
        return {"error": f"No data found for user_id={user_id}"}

    df = df.ffill().bfill()
    working_df, train_df, X, y, _ = prepare_dataset(df)

    today_features = build_today_features_row(working_df, features)
    predicted_score = float(pipeline.predict(today_features)[0])
    predicted_recovery_day = classify_recovery_day(predicted_score)
    confidence = build_prediction_confidence(best_model_metrics, len(train_df))
    recommended_action = build_recommended_action(predicted_recovery_day)

    latest_row = working_df.iloc[-1]
    reason = build_prediction_reason(latest_row, working_df)

    return {
        "user_id": user_id,
        "latest_day_used": str(latest_row["day"].date()),
        "history_days": int(len(df)),
        "training_rows": int(len(train_df)),
        "best_model": best_model_name,
        "best_model_metrics": best_model_metrics,
        "predicted_readiness_tomorrow": round(predicted_score),
        "predicted_readiness_tomorrow_raw": round(predicted_score, 2),
        "predicted_label": label_readiness(predicted_score),
        "predicted_recovery_day": predicted_recovery_day,
        "confidence_score": confidence["confidence_score"],
        "confidence_label": confidence["confidence_label"],
        "recommended_action": recommended_action,
        "reason": reason,
    }
```

### How to verify

1. Call `POST /train-model?user_id=<your-user-id>` once
2. Check that `services/analytics/serialized_models/model_<user-id>.joblib` was created
3. Call `GET /predict-readiness?user_id=<your-user-id>` — it should respond much faster the second time (no training)
4. Call it 5 times in a row — response time should be consistent and fast (< 200ms)

---

## Week 3, Task 5 — Write one ADR

### The problem in plain English

An ADR (Architecture Decision Record) is a short document that answers: "why did we build it this way?" It's written once and lives in `docs/`. It takes 20 minutes to write and prevents the question "wait, why is there a separate Python service?" from being answered with a shrug for the next two years.

The most non-obvious decision in this codebase is why analytics runs as a separate FastAPI service rather than as a Next.js API route. Write that one.

### Create `docs/adr-001-analytics-service.md`

```markdown
# ADR-001: Analytics as a separate FastAPI service

**Date:** 2024-XX-XX  
**Status:** Accepted

## Context

The health dashboard needs to run ML predictions (readiness forecasting) based on a user's Oura Ring data. There were two options for where to run this logic:

**Option A:** Run inference inside a Next.js API route (pure TypeScript/JavaScript)  
**Option B:** Run inference in a separate Python FastAPI service

## Decision

We chose Option B: a separate FastAPI service.

## Reasons

1. **The ML ecosystem is Python-native.** sklearn, pandas, numpy, and joblib have no meaningful JavaScript equivalents. Implementing model training and TimeSeriesSplit cross-validation in TypeScript would require either a wrapper around a Python subprocess (complexity, reliability issues) or porting the logic to JavaScript (maintenance burden, lower quality).

2. **Model training is CPU-bound.** Running it inside the Node.js event loop (which is single-threaded) would block all other requests during training. Python's multi-process model handles CPU-heavy work without blocking the web server.

3. **Independent deployability.** The analytics service can be restarted, redeployed, or swapped out without touching the Next.js app. If training takes 30 seconds, the web tier keeps serving.

## Tradeoffs

- **Extra operational surface.** Two processes to run locally instead of one. The worker must be able to reach the analytics service URL.
- **Network boundary between services.** A misconfigured `ANALYTICS_API_URL` causes silent prediction failures (mitigated by crashing on missing env vars — see `src/lib/env.ts`).
- **No auth between services.** Currently the Next.js server calls FastAPI over localhost. If this moves to a deployed multi-container environment, add network-level isolation (same VPC, no public internet exposure) rather than request-level auth.

## What would change this decision

If the ML requirements simplified to "just do a weighted average of the last 7 days," it would be worth collapsing this into a Next.js API route. The separate service is only worth the operational overhead because of the model training and selection logic.
```

---

## Week 3, Task 6 — Add OAuth state parameter validation

### The problem in plain English

The current OAuth callback at `src/app/api/auth/oura/callback/route.ts` is vulnerable to a **CSRF attack** on the OAuth flow.

Here's the attack: a malicious website can trick your browser into visiting `https://yourapp.com/api/auth/oura/callback?code=ATTACKERS_CODE`. Your server would then exchange that code for a token and connect your account to the attacker's Oura data. This is a real class of OAuth vulnerability.

The fix is the OAuth **state parameter**:
1. Before redirecting to Oura, generate a random secret and store it in a cookie
2. Pass it as `state=<secret>` in the Oura authorization URL
3. When Oura redirects back, verify that the `state` in the URL matches the cookie
4. If they don't match, reject the request

An attacker can't forge a matching state value because they don't know what random secret you generated.

### Step 1 — Install a crypto helper (already in Node.js, no install needed)

Node.js has `crypto.randomBytes` built-in. No new dependencies needed.

### Step 2 — Add state generation to your auth start route

You need a route that *starts* the OAuth flow and redirects the user to Oura. If you don't have one yet, create `src/app/api/auth/oura/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const state = randomBytes(16).toString("hex"); // 32-char random string

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OURA_CLIENT_ID!,
    redirect_uri: process.env.OURA_REDIRECT_URI!,
    scope: "daily heartrate workout tag session spo2 ring_configuration",
    state,
  });

  const ouraAuthUrl = `https://cloud.ouraring.com/oauth/authorize?${params}`;

  const response = NextResponse.redirect(ouraAuthUrl);

  // Store state in a cookie so we can verify it on callback
  response.cookies.set("oura_oauth_state", state, {
    httpOnly: true,   // JavaScript cannot read this cookie (protects against XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // expires in 10 minutes
    path: "/",
  });

  return response;
}
```

### Step 3 — Update the callback to verify state

Open `src/app/api/auth/oura/callback/route.ts`. Add state verification at the top of the handler:

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { syncQueue } from "@/lib/queue";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  // ---- VERIFY STATE ----
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oura_oauth_state")?.value;

  if (!stateParam || !storedState || stateParam !== storedState) {
    return NextResponse.json(
      { error: "Invalid OAuth state. Possible CSRF attack. Please try connecting again." },
      { status: 400 }
    );
  }
  // ---- END VERIFY STATE ----

  if (!code) {
    return NextResponse.json(
      { error: "Missing OAuth code" },
      { status: 400 }
    );
  }

  // ... rest of the existing callback code unchanged ...
```

After the check passes, clear the state cookie so it can't be reused:

```typescript
  // After the token exchange succeeds, clear the state cookie
  const callbackResponse = NextResponse.json({
    success: true,
    userId,
    message: "Oura sync process successfully scheduled in the background.",
  });
  callbackResponse.cookies.delete("oura_oauth_state");
  return callbackResponse;
```

### How to verify

1. Try visiting `/api/auth/oura/callback?code=fake_code&state=wrong_value` directly in your browser
2. You should get: `{ "error": "Invalid OAuth state..." }`
3. Go through the normal OAuth flow via `/api/auth/oura` — it should still work end-to-end

---

## Week 4, Task 7 — Batch the N+1 inserts in saveDailySummary

### The problem in plain English

**N+1 query** means: instead of doing one database call for N records, you're doing N separate calls in a loop.

In `src/lib/oura.ts`, both `saveRawDailyData` and `saveDailySummary` loop through rows and call `query(INSERT ...)` once per row:

```typescript
for (const row of data) {  // e.g. 30 iterations
  await query("INSERT INTO ...", [...])  // 30 separate round-trips to Postgres
}
```

Syncing 30 days × 5 sources = up to **150 sequential database round-trips**. Each round-trip includes network overhead (even on localhost), connection acquisition time, and query parsing. This is the most common performance mistake in database-backed apps.

The fix: build one query that inserts all rows at once:
```sql
INSERT INTO oura_raw_daily (user_id, day, source, payload)
VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12) ...
ON CONFLICT ...
```

### Step 1 — Add a batch insert helper in db.ts

Open `src/lib/db.ts`. Add this helper below the existing `query` function:

```typescript
/**
 * Builds a parameterized multi-row INSERT statement from an array of rows.
 * Returns the SQL string and the flat params array.
 *
 * Example: batchInsertParams(["a","b"], [[1,2],[3,4]])
 * → sql: "($1,$2),($3,$4)"
 * → params: [1, 2, 3, 4]
 */
export function buildValuePlaceholders(
  columnCount: number,
  rows: unknown[][]
): { placeholders: string; params: unknown[] } {
  const params: unknown[] = [];
  const placeholders = rows
    .map((row, rowIndex) => {
      const slots = row.map((_, colIndex) => {
        params.push(row[colIndex]);
        return `$${rowIndex * columnCount + colIndex + 1}`;
      });
      return `(${slots.join(",")})`;
    })
    .join(",");
  return { placeholders, params };
}
```

### Step 2 — Rewrite saveRawDailyData to batch

In `src/lib/oura.ts`, replace the `saveRawDailyData` function:

```typescript
async function saveRawDailyData(
  userId: string,
  source: OuraDailySource,
  payload: Record<string, unknown>
) {
  const data = Array.isArray(payload.data) ? payload.data : [];

  // Filter to rows that have a valid day field
  const rows = data
    .filter((row) => typeof row?.day === "string")
    .map((row) => [userId, row.day, source, JSON.stringify(row)]);

  if (rows.length === 0) return;

  const { placeholders, params } = buildValuePlaceholders(4, rows);

  await query(
    `INSERT INTO oura_raw_daily (user_id, day, source, payload)
     VALUES ${placeholders}
     ON CONFLICT (user_id, day, source)
     DO UPDATE SET payload = excluded.payload,
                   fetched_at = now()`,
    params
  );
}
```

Before: 30 queries. After: 1 query.

### Step 3 — Rewrite saveDailySummary to batch

Replace the `saveDailySummary` function:

```typescript
async function saveDailySummary(userId: string, source: OuraDailySource, payload: Record<string, unknown>) {
  const data = Array.isArray(payload.data) ? payload.data : [];

  type RowTuple = [string, string, ...Array<number | string | null>];
  const rows: RowTuple[] = [];

  for (const row of data) {
    const rawDay = typeof row?.day === "string" ? row.day : null;
    if (!rawDay) continue;

    const day = shiftDayForward(rawDay);
    const patch = buildSummaryPatch(source, row as Record<string, unknown>);
    if (isEmptyPatch(patch)) continue;

    rows.push([
      userId,
      day,
      patch.sleep_total_seconds ?? null,
      patch.sleep_efficiency ?? null,
      patch.sleep_latency_seconds ?? null,
      patch.readiness_score ?? null,
      patch.steps ?? null,
      patch.activity_score ?? null,
      patch.hrv_avg_ms ?? null,
      patch.resting_hr_bpm ?? null,
      patch.stress_high_minutes ?? null,
      patch.recovery_high_minutes ?? null,
      patch.stress_day_summary ?? null,
      patch.sleep_deep_seconds ?? null,
      patch.sleep_rem_seconds ?? null,
      patch.sleep_light_seconds ?? null,
      patch.sleep_awake_seconds ?? null,
    ]);
  }

  if (rows.length === 0) return;

  const { placeholders, params } = buildValuePlaceholders(17, rows);

  await query(
    `INSERT INTO daily_summary (
       user_id, day,
       sleep_total_seconds, sleep_efficiency, sleep_latency_seconds,
       readiness_score, steps, activity_score, hrv_avg_ms, resting_hr_bpm,
       stress_high_minutes, recovery_high_minutes, stress_day_summary,
       sleep_deep_seconds, sleep_rem_seconds, sleep_light_seconds, sleep_awake_seconds,
       updated_at
     ) VALUES ${placeholders.replace(/\(([^)]+)\)/g, '($1, now())')}
     ON CONFLICT (user_id, day)
     DO UPDATE SET
       sleep_total_seconds = coalesce(excluded.sleep_total_seconds, daily_summary.sleep_total_seconds),
       sleep_efficiency = coalesce(excluded.sleep_efficiency, daily_summary.sleep_efficiency),
       sleep_latency_seconds = coalesce(excluded.sleep_latency_seconds, daily_summary.sleep_latency_seconds),
       readiness_score = coalesce(excluded.readiness_score, daily_summary.readiness_score),
       steps = coalesce(excluded.steps, daily_summary.steps),
       activity_score = coalesce(excluded.activity_score, daily_summary.activity_score),
       hrv_avg_ms = coalesce(excluded.hrv_avg_ms, daily_summary.hrv_avg_ms),
       resting_hr_bpm = coalesce(excluded.resting_hr_bpm, daily_summary.resting_hr_bpm),
       stress_high_minutes = coalesce(excluded.stress_high_minutes, daily_summary.stress_high_minutes),
       recovery_high_minutes = coalesce(excluded.recovery_high_minutes, daily_summary.recovery_high_minutes),
       stress_day_summary = coalesce(excluded.stress_day_summary, daily_summary.stress_day_summary),
       sleep_deep_seconds = coalesce(excluded.sleep_deep_seconds, daily_summary.sleep_deep_seconds),
       sleep_rem_seconds = coalesce(excluded.sleep_rem_seconds, daily_summary.sleep_rem_seconds),
       sleep_light_seconds = coalesce(excluded.sleep_light_seconds, daily_summary.sleep_light_seconds),
       sleep_awake_seconds = coalesce(excluded.sleep_awake_seconds, daily_summary.sleep_awake_seconds),
       updated_at = now()`,
    params
  );
}
```

### How to verify

Add a quick timer around the sync call. In the Pino log you set up in Week 1, `durationMs` will tell you the before/after. A 30-day sync that previously took 800ms should drop to under 200ms.

You can also verify correctness: run a sync, check that all 30 days appear in `daily_summary` with correct values. The data should be identical to before — only the number of queries changed.

---

## Checklist

- [ ] Week 1 — Pino structured logging in syncWorker
- [ ] Week 1 — Replace hardcoded localhost, add .env.example
- [ ] Week 2 — Unit tests for 5 pure functions (Vitest + pytest)
- [ ] Week 2 — predict-readiness uses saved model, /train-model POST endpoint added
- [ ] Week 3 — ADR-001 written
- [ ] Week 3 — OAuth state parameter validation added
- [ ] Week 4 — Batched inserts in saveDailySummary
