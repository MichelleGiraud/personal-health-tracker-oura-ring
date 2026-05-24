# System Diagram

## Components and Data Flows

```mermaid
flowchart TD
    subgraph Browser["Browser (User)"]
        U1[OAuth Login URL]
        U2[Dashboard Page]
        U3[Manual Sync URL]
    end

    subgraph NextJS["Next.js App  ·  localhost:3000"]
        CB["/api/auth/oura/callback\nroute.ts"]
        SYNC["/api/oura/sync\nroute.ts"]
        PAGE["Dashboard Page\nhome.helper.ts"]
    end

    subgraph Queue["BullMQ  ·  OuraSyncJobs"]
        JOB["Job: fetchDailySummaryMetrics\n{ userId, days }"]
        RETRY["Retry: 3× exponential backoff\n(5s, 10s, 20s)"]
    end

    subgraph Worker["Sync Worker  ·  separate Node process"]
        WK["syncWorker.ts\npulls jobs from queue"]
        OURA_LIB["oura.ts\nsyncOuraForUser()"]
    end

    subgraph OuraAPI["Oura Ring API  ·  api.ouraring.com"]
        TOKEN_EP["POST /oauth/token\ncode → tokens"]
        DATA_EP["GET /v2/usercollection/\nsleep, daily_sleep,\ndaily_activity,\ndaily_readiness,\ndaily_stress"]
    end

    subgraph Postgres["PostgreSQL  ·  localhost:5433"]
        APP_USER["app_user"]
        OURA_TOKEN["oura_token\naccess + refresh tokens"]
        RAW["oura_raw_daily\nraw JSON payloads"]
        SUMMARY["daily_summary\naggregated metrics"]
    end

    subgraph Redis["Redis  ·  localhost:6379"]
        Q_STORE["Queue storage\n(BullMQ backing)"]
    end

    subgraph Analytics["FastAPI Analytics Service  ·  localhost:8000"]
        TRAIN["POST /train-model\nloads history → trains best model\n→ saves .joblib to disk"]
        PREDICT["GET /predict-readiness\nloads model → predicts tomorrow's readiness"]
        MODELS["serialized_models/\nmodel_{userId}.joblib"]
    end

    %% OAuth Flow
    U1 -->|"1. redirect: ?code=..."| CB
    CB -->|"2. exchange code"| TOKEN_EP
    TOKEN_EP -->|"3. access_token + refresh_token"| CB
    CB -->|"4. upsert tokens"| OURA_TOKEN
    CB -->|"5. upsert or create"| APP_USER
    CB -->|"6. enqueue job (days=30)"| JOB

    %% Manual Sync Flow
    U3 -->|"GET ?days=N"| SYNC
    SYNC -->|"lookup token"| OURA_TOKEN
    SYNC -->|"enqueue job"| JOB

    %% Queue → Redis → Worker
    JOB <-->|"backed by"| Q_STORE
    RETRY --> JOB
    JOB -->|"worker pulls job"| WK

    %% Worker syncs Oura data
    WK --> OURA_LIB
    OURA_LIB -->|"fetch 5 endpoints\nauto-refresh token on 401"| DATA_EP
    DATA_EP --> OURA_LIB
    OURA_LIB -->|"save raw JSON"| RAW
    OURA_LIB -->|"upsert merged metrics"| SUMMARY
    OURA_LIB -->|"refresh token if used"| OURA_TOKEN

    %% Worker triggers ML training
    WK -->|"POST /train-model?user_id=..."| TRAIN
    TRAIN -->|"SELECT daily_summary"| SUMMARY
    TRAIN -->|"save pipeline"| MODELS

    %% Dashboard reads data
    U2 -->|"open dashboard"| PAGE
    PAGE -->|"SELECT daily_summary"| SUMMARY
    PAGE -->|"GET /predict-readiness"| PREDICT
    PREDICT -->|"SELECT daily_summary"| SUMMARY
    PREDICT -->|"load pipeline"| MODELS
    PREDICT -->|"prediction JSON"| PAGE
    PAGE -->|"render cards + charts"| U2
```

---

## Two Key Flows at a Glance

### Flow 1 — OAuth + Initial Sync

```
Browser
  → GET /api/auth/oura/callback?code=...
    → Exchange code with Oura → save tokens to DB
    → Enqueue BullMQ job (days=30)
    → Return 200 immediately

Worker (background)
  → Pull job from Redis queue
  → Fetch 5 Oura endpoints (sleep, readiness, activity, stress)
  → Save raw + summarised data to Postgres
  → POST /train-model to Analytics service

Analytics
  → Load daily_summary from Postgres
  → Cross-validate 4 models with TimeSeriesSplit
  → Train winner on full data
  → Serialize pipeline to disk as model_{userId}.joblib
```

### Flow 2 — Dashboard Render

```
Browser → Dashboard page
  → Next.js reads daily_summary from Postgres (charts, cards)
  → Next.js calls GET /predict-readiness on Analytics service
    → Analytics loads saved model from disk
    → Predicts tomorrow's readiness score (0–100)
    → Returns label, confidence, recommended action, reason
  → Page renders with both historical data + ML prediction
```

---

## ML Model Detail

```mermaid
flowchart LR
    DS["daily_summary rows\n(per user, ordered by day)"]
    FE["Feature Engineering\n• sleep_hours, 3-day rolling avgs\n• HRV / steps / stress deltas\n• sleep_debt_hours"]
    CV["TimeSeriesSplit CV\n3 folds — past predicts future"]
    COMPARE["Compare 4 models\nDummyMean · LinearRegression\nRidge · RandomForest\nRank by MAE"]
    BEST["Train best model\non full dataset"]
    SAVE["Serialize pipeline\nserialised_models/model_{id}.joblib"]
    PRED["Predict tomorrow's readiness\n→ label (Optimal/Good/Fair/Low)\n→ recovery day (Ready/Moderate/Recovery)\n→ confidence score\n→ recommended action"]

    DS --> FE --> CV --> COMPARE --> BEST --> SAVE
    SAVE --> PRED
```