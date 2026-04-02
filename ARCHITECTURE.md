# SuperDreams v4.1 Architecture

> Design date: 2026-04-02
> Designer: Accio (AI Assistant)
> Review: adminlove520

---

## 1. Positioning

### What is SuperDreams?

**One line**: AI Agent cognitive memory system -- achieving memory consolidation through "dreaming".

**Three layers of value**:
1. **Dream Engine**: Scan logs -> Extract memories -> Health assessment -> Generate report (real dreaming, not simulation).
2. **Agent Dashboard**: Each Lobster (Agent) has its own Dashboard, visualizing memory networks and growth trajectory.
3. **Control Center**: Central service, manages multiple Lobster Agents, cross-Agent search, cyber-immortality / digital life.

### Core Concepts

| Term | Meaning |
|------|---------|
| **Lobster** | An AI Agent instance with its own memory storage |
| **Dream** | Periodic memory consolidation: scan -> extract -> deduplicate -> score -> report |
| **SuperDream** | The brand name -- cognitive evolution beyond ordinary dreaming |
| **Control Center** | Central service managing multiple Lobsters, global search and view |
| **Health Score** | 5-dimension weighted score, quantifying memory system's "mental state" |

---

## 2. Architecture Overview

### Two-Layer Architecture

```
+------------------------------------------------------+
|                    SuperDreams                         |
|                                                       |
|  +-------------------+   +-----------------------+   |
|  |  Agent (Lobster)   |   |  Control Center       |   |
|  |                    |   |                       |   |
|  |  +-------------+  |   |  +-------------+      |   |
|  |  | Dashboard   |  |   |  | Dashboard   |      |   |
|  |  | (Next.js)   |  |   |  | (Next.js)   |      |   |
|  |  +------+------+  |   |  +------+------+      |   |
|  |         |          |   |         |             |   |
|  |  +------+------+  |   |  +------+------+      |   |
|  |  | API Routes  |  |   |  | API Routes  |      |   |
|  |  | + Dream     +--+-->+  | + Auth       |      |   |
|  |  |   Engine    |  |   |  | + Search     |      |   |
|  |  +------+------+  |   |  +------+------+      |   |
|  |         |          |   |         |             |   |
|  |  +------+------+  |   |  +------+------+      |   |
|  |  |  store.ts   |  |   |  |  store.ts   |      |   |
|  |  |  Redis /    |  |   |  |  Redis /    |      |   |
|  |  |  SQLite     |  |   |  |  SQLite     |      |   |
|  |  +-------------+  |   |  +-------------+      |   |
|  +-------------------+   +-----------------------+   |
+------------------------------------------------------+
```

### Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| **Storage** | Dual-backend (Upstash Redis + SQLite) | Redis for production persistence; SQLite for local dev |
| **Web Framework** | Next.js 14.2.35 | Full-stack: API Routes + SSR/CSR. Pinned to avoid Turbopack |
| **Dream Engine** | Built into API Route | No separate process needed, Vercel compatible |
| **Auth** | API Key + JWT | Agent registers with Center via API Key, gets JWT for requests |
| **Deployment** | Vercel | Free tier, global CDN, Serverless |
| **Cloud DB** | Upstash Redis | Replaces deprecated @vercel/kv, persistent across deploys |

---

## 3. Directory Structure

```
SuperDreams/
+-- agent/                    # Lobster Agent (individual)
|   +-- app/                  #   UI pages and API routes
|   +-- components/           #   UI components (HealthRing, MemoryMatrix, etc.)
|   +-- lib/                  #   Core (store.ts, db.ts, dream-engine.ts)
|   +-- data/                 #   superdreams.db (SQLite, local only)
+-- center/                   # Control Center (central)
|   +-- app/                  #   Admin dashboard UI
|   +-- lib/                  #   Central DB, auth, store
+-- docs/                     # Documentation
|   +-- architecture.md       #   System architecture (detailed)
|   +-- data-flow.md          #   Data flow diagrams
|   +-- agent-guide.md        #   Agent deployment guide
|   +-- center-guide.md       #   Center deployment guide
+-- scripts/                  # CLI scripts (dream.js)
+-- memory/                   # Raw log files (dream scan source)
+-- SKILLS/                   # Agent Skill definitions
```

---

## 4. Storage Layer

### Dual-Backend Design (v4.1)

Both Agent and Center use `store.ts` as a unified storage layer:

```
store.ts
   |
   +-- isRedis()? (checks UPSTASH_REDIS_REST_URL)
   |      |
   |     YES --> @upstash/redis (production)
   |      |      Agent prefix: sd:
   |      |      Center prefix: ctr:
   |      |
   |      NO --> SQLite (development)
   |             Agent: sql.js (WASM, Vercel /tmp)
   |             Center: better-sqlite3 (native)
```

### Redis Key Schema

**Agent (sd: prefix)**:
- `sd:memory:{id}` -- Memory object
- `sd:memories:ids` -- All memory IDs
- `sd:dream:{id}` -- Dream object
- `sd:dreams:ids` -- All dream IDs
- `sd:health:{id}` -- Health record
- `sd:health:ids` -- All health IDs
- `sd:synclog:{id}` -- Sync log entry
- `sd:synclogs:ids` -- All sync log IDs

**Center (ctr: prefix)**:
- `ctr:agent:{id}` -- Agent registration
- `ctr:agents:index` -- All agent IDs
- `ctr:memory:{id}` -- Synced memory
- `ctr:dream:{id}` -- Synced dream

---

## 5. Core Flow: Dreaming

### 5-Stage Pipeline

1. **Scan**: Read `memory/*.md` log files.
2. **Extract**: LLM extracts Facts, Decisions, Lessons.
3. **Deduplicate**: Compare with existing memories, prevent duplicates.
4. **Score**: Calculate 5-dimension health score.
5. **Consolidate**: Update storage, generate report.

### Health Score Formula

```
Score = freshness * 0.20
      + coverage * 0.20
      + coherence * 0.20
      + efficiency * 0.20
      + accessibility * 0.20
```

Each dimension: 0.0 - 1.0. Final score: 0 - 100.

---

## 6. API Design (Agent)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/memories | GET | Search/list memories |
| /api/memories | POST | Create memory |
| /api/memories/{id} | GET/PUT/DELETE | Single memory CRUD |
| /api/dreams | GET | Dream history |
| /api/dreams | POST | Trigger dream |
| /api/health | GET | Health score + history |
| /api/stats | GET | Overview statistics |
| /api/sync | POST | Sync to Center |
| /api/sync?action=logs | GET | Sync log history |

---

## 7. UI System (v4.1)

### Neon Glow CSS

| CSS Class | Purpose |
|-----------|---------|
| `.neon-text-green/blue/purple/cyan/orange` | Glowing text with text-shadow |
| `.neon-card` / `.neon-card-blue` / `.neon-card-purple` | Cards with gradient bg + glow border |
| `.neon-btn` | Glowing buttons (gradient bg + box-shadow) |
| `.ambient-glow` / `.grid-bg` | Page-level background effects |
| `.stat-value-*` | Stat number glow styles |
| `.text-bright/medium/dim/muted` | High-contrast text hierarchy |

### Components

| Component | Description |
|-----------|-------------|
| HealthRing | SVG ring with glow, shows 0-100 health score |
| StatsGrid | 4-card statistics grid |
| MemoryMatrix | Memory type distribution with animated bars |
| SyncLog | Sync history with success/error indicators |
| RecentDreams | Latest dream cards |
| RecentMemories | Latest memory cards |
| SyncSettings | Center URL + API key configuration |

---

## 8. Deployment

### Vercel Projects

| Project | Source | Build |
|---------|--------|-------|
| Agent | repo root | `cd agent && npm install && npm run build` |
| Center | `center/` subdirectory | `npm run build` |

### Required Env Vars

**Agent**:
- `UPSTASH_REDIS_REST_URL` (production)
- `UPSTASH_REDIS_REST_TOKEN` (production)

**Center**:
- `JWT_SECRET` (required)
- `UPSTASH_REDIS_REST_URL` (production)
- `UPSTASH_REDIS_REST_TOKEN` (production)

### Important Notes

1. Root `package.json` must have `"next": "14.2.35"` (exact, no ^) for Vercel framework detection
2. Root build script: `"cd agent && npm install && npm run build"` -- Vercel only runs npm install at root
3. Next.js v16 is incompatible (Turbopack breaks sql.js WASM webpack config)
