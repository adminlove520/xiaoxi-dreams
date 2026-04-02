# SuperDreams v4.1 Architecture

## 1. System Overview

SuperDreams is a monorepo with two Next.js applications:

- **agent/** - Individual AI agent dashboard. Memory visualization, health monitoring, dream triggering. Built on Next.js 14.2.35.
- **center/** - Multi-agent control center. Aggregates data from multiple agents, provides global dashboard and sync management.

## 2. System Architecture

```
+------------------+          +------------------+
|   User/Browser   |          |  AI Agent (e.g.  |
|                  |          |  openclaw)       |
+--------+---------+          +--------+---------+
         |                             |
         | HTTP                        | web_fetch (via Skill)
         v                             v
+--------+-----------------------------+---------+
|              Agent Dashboard (Next.js)          |
|                                                 |
|  Pages:          API Routes:                    |
|  /               /api/memories    (CRUD)        |
|  /dreams         /api/dreams      (trigger)     |
|  /memories       /api/health      (score)       |
|                  /api/stats       (overview)    |
|                  /api/sync        (to center)   |
|                                                 |
|  +-------------------------------------------+ |
|  |           store.ts (unified layer)         | |
|  |  isKV()? --> Upstash Redis : SQLite        | |
|  +-------------------------------------------+ |
+-----------------------+-------------------------+
                        |
                        | POST /api/sync
                        v
+-----------------------------------------------+
|           Center Dashboard (Next.js)           |
|                                                |
|  API Routes:                                   |
|  /api/sync/memory    (receive memories)        |
|  /api/sync/dream     (receive dreams)          |
|  /api/agents         (agent registry)          |
|  /api/dashboard      (aggregated stats)        |
|                                                |
|  +------------------------------------------+ |
|  |          store.ts (unified layer)         | |
|  |  isKV()? --> Upstash Redis : SQLite       | |
|  +------------------------------------------+ |
+-----------------------------------------------+
```

## 3. Component Architecture

### Agent (agent/)

```
agent/
+-- app/
|   +-- page.tsx              # Main dashboard
|   +-- dreams/page.tsx       # Dream history page
|   +-- memories/page.tsx     # Memory browser page
|   +-- api/
|       +-- memories/route.ts # Memory CRUD API
|       +-- dreams/route.ts   # Dream trigger API
|       +-- health/route.ts   # Health score API
|       +-- stats/route.ts    # Statistics API
|       +-- sync/route.ts     # Sync to Center API
+-- lib/
|   +-- store.ts              # Unified storage (Redis/SQLite auto-switch)
|   +-- db.ts                 # SQLite implementation (sql.js WASM)
|   +-- types.ts              # TypeScript types (Memory, Health, Dream, Stats)
|   +-- dream-engine.ts       # Dream execution engine
|   +-- health.ts             # Health score calculator
+-- components/
    +-- HealthRing.tsx         # SVG health score ring with glow
    +-- StatsGrid.tsx          # 4-card statistics grid
    +-- MemoryMatrix.tsx       # Memory type distribution bars
    +-- SyncLog.tsx            # Sync history list
    +-- RecentDreams.tsx       # Latest dream cards
    +-- RecentMemories.tsx     # Latest memory cards
    +-- SyncSettings.tsx       # Center URL + API key config
```

### Center (center/)

```
center/
+-- app/
|   +-- page.tsx              # Dashboard
|   +-- api/
|       +-- sync/memory/route.ts  # Receive memories from agents
|       +-- sync/dream/route.ts   # Receive dreams from agents
|       +-- agents/route.ts       # Agent registry
|       +-- dashboard/route.ts    # Aggregated statistics
+-- lib/
    +-- store.ts              # Unified storage (Redis/SQLite auto-switch)
    +-- db.ts                 # SQLite implementation (better-sqlite3)
    +-- auth.ts               # JWT authentication
```

## 4. Storage Layer Design

Both apps use the same dual-backend pattern:

```
                    store.ts
                       |
          +------------+------------+
          |                         |
   UPSTASH_REDIS_REST_URL    No env vars
   env var exists?
          |                         |
          v                         v
   Upstash Redis             SQLite (local)
   (production)              (development)
```

### Redis Key Schema

**Agent prefix: `sd:`**

| Key Pattern | Type | Description |
|-------------|------|-------------|
| sd:memory:{id} | JSON | Single memory object |
| sd:memories:ids | string[] | All memory IDs (newest first) |
| sd:dream:{id} | JSON | Single dream object |
| sd:dreams:ids | string[] | All dream IDs (newest first) |
| sd:health:{id} | JSON | Single health record |
| sd:health:ids | number[] | All health record IDs |
| sd:health:counter | number | Auto-increment counter |
| sd:synclog:{id} | JSON | Single sync log entry |
| sd:synclogs:ids | string[] | All sync log IDs |

**Center prefix: `ctr:`**

| Key Pattern | Type | Description |
|-------------|------|-------------|
| ctr:agent:{id} | JSON | Registered agent info |
| ctr:agents:index | string[] | All agent IDs |
| ctr:memory:{id} | JSON | Synced memory |
| ctr:dream:{id} | JSON | Synced dream |
| ctr:synclog:{id} | JSON | Sync log entry |

## 5. Technology Stack

| Layer | Agent | Center |
|-------|-------|--------|
| Framework | Next.js 14.2.35 | Next.js 14.x |
| Local DB | sql.js (WASM) | better-sqlite3 |
| Cloud DB | Upstash Redis | Upstash Redis |
| UI Library | Tailwind CSS | Tailwind CSS |
| UI Theme | Neon Glow (cyberpunk) | Standard |
| Animation | Framer Motion | - |
| Icons | Lucide React | Lucide React |
| Deployment | Vercel | Vercel |
| Auth | - | JWT + API Key |

## 6. Security

| Aspect | Implementation |
|--------|---------------|
| Center API auth | JWT Bearer token in Authorization header |
| Sync auth | API key passed in request body + Authorization header |
| Agent API | Open (designed for localhost or Vercel private) |
| Data isolation | Agent uses `sd:` prefix, Center uses `ctr:` prefix |
| Env vars | Sensitive values stored in Vercel Environment Variables |
