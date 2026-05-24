# Project Structure

Use this file if you want the shortest possible explanation of where things live.

```text
personal-health-tracker-oura-ring/
├── apps/
│   └── web/                  Next.js app, API routes, queue, worker
├── docs/
│   ├── architecture.md       System diagrams and runtime flows
│   └── project-structure.md  This file
├── infra/
│   └── postgres/             Local database bootstrap SQL
├── packages/
│   └── db/                   Shared database schema assets
├── services/
│   └── analytics/            FastAPI ML service
├── docker-compose.yml        Local Postgres + Redis
├── package.json              Root helper scripts
└── README.md                 Main project entrypoint
```

## Ignore These Folders While Learning the Repo

- `node_modules/`
- `apps/web/.next/`
- `.git/`
- `.venv/`
- `services/analytics/.venv/`
- `services/analytics/serialized_models/`

Those are dependency, cache, or generated-output folders. They are not the project structure you should reason about first.
