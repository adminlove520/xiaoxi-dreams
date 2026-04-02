# SuperDreams

> AI Agent Cognitive Memory System - Memory consolidation through "dreaming"

[![Version](https://img.shields.io/badge/version-4.1.1-green)](https://github.com/adminlove520/SuperDreams)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## What is SuperDreams?

SuperDreams provides a real memory system for AI Agents (we call them **Lobsters**). Each Agent periodically "dreams" -- scanning logs, extracting knowledge, consolidating memories, and evaluating cognitive health -- achieving continuous cognitive evolution.

### Core Features

- **Real Dream Engine** -- Scan logs -> Extract memories -> Deduplicate -> Score -> Generate report
- **5-Dimension Health Assessment** -- Freshness, Coverage, Coherence, Efficiency, Accessibility
- **Agent Dashboard** -- Each agent has its own memory visualization panel with neon glow UI
- **Control Center** -- Multi-agent management, cross-agent search
- **Dual Storage Backend** -- Auto-switches between Upstash Redis (production) and SQLite (development)
- **Vercel Compatible** -- One-click cloud deployment with persistent storage

## Architecture

```
SuperDreams/
+-- agent/              # Agent Dashboard (Next.js 14.2.35 + sql.js/Upstash Redis)
|   +-- app/            #   Dashboard Pages + API Routes
|   +-- components/     #   UI (HealthRing, MemoryMatrix, SyncLog, etc.)
|   +-- lib/            #   Core (store.ts, db.ts, dream-engine.ts, health.ts)
|   +-- data/           #   SQLite database (local dev)
+-- center/             # Control Center (Next.js + better-sqlite3/Upstash Redis)
|   +-- app/            #   Dashboard + API
|   +-- lib/            #   Auth + Store
+-- docs/               # Documentation
|   +-- architecture.md #   System architecture diagrams
|   +-- data-flow.md    #   Data flow and logic diagrams
|   +-- agent-guide.md  #   Agent deployment and usage guide
|   +-- center-guide.md #   Center deployment and usage guide
+-- SKILLS/             # Agent Skills
|   +-- superdreams-agent.md  # Skill for AI agents to manage memories via API
+-- scripts/            # CLI tools
+-- memory/             # Log files (dream scan source)
```

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/adminlove520/SuperDreams.git
cd SuperDreams

# Agent Dashboard
cd agent && npm install

# Control Center (optional)
cd ../center && npm install
```

### 2. Start Agent Dashboard

```bash
cd agent
npm run dev
# Visit http://localhost:3000
```

### 3. Trigger First Dream

```bash
# From root directory
node scripts/dream.js
```

### 4. Deploy to Vercel (Production)

```bash
# Agent project
# Set env vars: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
# Build command auto-runs: cd agent && npm install && npm run build
```

See [Agent Deployment Guide](docs/agent-guide.md) and [Center Deployment Guide](docs/center-guide.md) for details.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, component design, storage layer |
| [Data Flow](docs/data-flow.md) | Memory upload, dream, sync, health calculation flows |
| [Agent Guide](docs/agent-guide.md) | Agent deployment, API reference, Skill integration |
| [Center Guide](docs/center-guide.md) | Center deployment, multi-agent management, sync setup |
| [API Reference](SKILLS/api.md) | REST API endpoints |

## Storage

SuperDreams uses a **dual-backend storage layer** that auto-detects the environment:

| Environment | Agent Storage | Center Storage |
|-------------|--------------|----------------|
| Local Dev | sql.js (WASM SQLite) | better-sqlite3 |
| Vercel/Production | Upstash Redis | Upstash Redis |

Detection: If `UPSTASH_REDIS_REST_URL` env var exists -> Upstash Redis, otherwise -> SQLite.

Key prefixes: Agent uses `sd:`, Center uses `ctr:` to avoid collision when sharing the same Redis instance.

## AI Agent Integration (Skill)

AI Agents (like openclaw) can manage their memories via the `superdreams-agent` Skill:

```
# Upload a memory
POST /api/memories { name, type, summary, content, importance, tags }

# Trigger dreaming
POST /api/dreams

# Check health
GET /api/health

# Sync to Center
POST /api/sync { centerUrl, apiKey }
```

See [SKILLS/superdreams-agent.md](SKILLS/superdreams-agent.md) for full Skill documentation.

## Roadmap

- [x] v4.0 Architecture refactor (SQLite + Monorepo)
- [x] Real dream engine
- [x] 5-dimension health scoring
- [x] v4.1 Neon glow UI + Memory Matrix + Sync Log + Upstash Redis
- [ ] Vector search for memories (RAG)
- [ ] Automated tweet/weekly report generation

## Contributing

PRs and Issues welcome. Let's build cyber memories for AI together.

## License

[MIT](LICENSE)
