# Architecture

This document explains how the current system works after the refactor changes that have already been implemented.

## Refactor Status

- [x] Part 2: Separate environment variables and service configs
- [ ] Part 3: Not implemented in this repo yet
- [x] Part 4: Asynchronous Oura ingestion with BullMQ

## High-Level Architecture

```mermaid
flowchart LR
    U[User Browser]
    W[Next.js Web App<br/>apps/web]
    Q[BullMQ Queue<br/>OuraSyncJobs]
    R[(Redis)]
    O[Oura API]
    DB[(PostgreSQL)]
    A[FastAPI Analytics Service<br/>services/analytics]
    M[(Serialized ML Models)]

    U -->|Open dashboard / OAuth callback / manual sync| W
    W -->|Read dashboard data| DB
    W -->|Enqueue sync job| Q
    Q --> R
    R --> Q
    Q -->|Processed by| WK[Sync Worker<br/>apps/web/src/workers/syncWorker.ts]
    WK -->|Fetch wearable data| O
    WK -->|Save raw + summary data| DB
    WK -->|POST /train-model| A
    A -->|Read training data| DB
    A -->|Save trained model| M
    W -->|GET /predict-readiness| A
    A -->|Read latest user history| DB
```

## Main Runtime Flow

```mermaid
sequenceDiagram
    participant User
    participant Next as Next.js API
    participant Queue as BullMQ Queue
    participant Worker as Sync Worker
    participant Oura as Oura API
    participant DB as PostgreSQL
    participant ML as FastAPI Analytics

    User->>Next: GET /api/auth/oura/callback?code=...
    Next->>Oura: Exchange OAuth code for tokens
    Oura-->>Next: access_token + refresh_token
    Next->>DB: Save or update tokens
    Next->>Queue: Add OuraSyncJobs job
    Next-->>User: Return immediately

    Worker->>Queue: Pull pending job
    Worker->>Oura: Fetch sleep/activity/readiness/stress data
    Worker->>DB: Save raw Oura payloads
    Worker->>DB: Update daily_summary rows
    Worker->>ML: POST /train-model?user_id=...
    ML->>DB: Load user history
    ML->>ML: Train best model
    ML->>ML: Save model to serialized_models/
```

## Dashboard Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js Page
    participant DB as PostgreSQL
    participant API as FastAPI Analytics

    User->>Web: Open dashboard
    Web->>DB: Read latest daily_summary data
    Web->>DB: Read history for charts
    Web->>API: GET /predict-readiness?user_id=...
    API->>DB: Load user training data
    API-->>Web: Prediction JSON
    Web-->>User: Render dashboard cards and charts
```

## Folder Roles

- `apps/web`: Next.js UI, API routes, queue setup, and background worker.
- `services/analytics`: FastAPI ML service.
- `infra/postgres`: database bootstrap SQL for local development.
- `packages/db`: schema snapshot and DB-related assets.
- `docs`: architecture and project-level documentation.

## Local Processes

```mermaid
flowchart TD
    DEV[Developer Terminal]
    DB[(Postgres Container)]
    REDIS[(Redis Container)]
    WEB[Next.js Dev Server]
    WORKER[Sync Worker Process]
    API[FastAPI Uvicorn Process]

    DEV -->|npm run db:up| DB
    DEV -->|npm run db:up| REDIS
    DEV -->|npm run web:dev| WEB
    DEV -->|npm run web:worker| WORKER
    DEV -->|cd services/analytics && uvicorn main:app --reload| API
```

## Mental Model

1. The web app is the UI and HTTP entrypoint.
2. PostgreSQL is the source of truth.
3. Redis is only used for background job queueing.
4. The worker handles slow Oura sync work.
5. The analytics service handles training and prediction.
6. The dashboard reads from PostgreSQL and asks analytics for ML output.
