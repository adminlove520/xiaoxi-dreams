# SuperDreams

> AI Agent Cognitive Memory System - Memory consolidation through "dreaming"

[![Version](https://img.shields.io/github/v/release/adminlove520/SuperDreams?color=green)](https://github.com/adminlove520/SuperDreams/releases)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![NPM](https://img.shields.io/npm/v/openclaw?color=red)](https://www.npmjs.com/package/openclaw)

## What is SuperDreams?

SuperDreams provides a real memory system for AI Agents (we call them **Lobsters**). Each Agent periodically "dreams" -- scanning logs, extracting knowledge, consolidating memories, and evaluating cognitive health -- achieving continuous cognitive evolution.

## 🦞 SD-Dream CLI

Control your SuperDreams Agent directly from the command line.

```bash
# Install
npm install -g sd-dream

# Config (Persist to ~/.sd-dream.json)
sd-dream config --url https://agent.vercel.app --key your-api-key

# OR use Environment Variables
export SUPERDREAMS_URL=https://agent.vercel.app
export CENTER_API_KEY=your-api-key
export CENTER_URL=https://xiaoxi-dreams.vercel.app

# Dream & Sync
sd-dream dream
sd-dream sync

# Stats
sd-dream stats
```

## Core Features

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
+-- center/             # Control Center (Next.js + sql.js/Upstash Redis)
|   +-- app/            #   Dashboard + API
|   +-- lib/            #   Auth + Store
+-- cli/                # SD-Dream CLI (Node.js tool)
|   +-- bin/            #   sd-dream binary
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

# Install all workspace dependencies
npm install
```

### 2. Start Agent Dashboard

```bash
npm run dev:agent
# Visit http://localhost:3000
```

### 3. Use SD-Dream CLI

```bash
# In another terminal
cd cli && npm link
sd-dream dream
```

### 4. Deploy to Vercel (Production)

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
| Local Dev | sql.js (WASM SQLite) | sql.js (WASM SQLite) |
| Vercel/Production | Upstash Redis | Upstash Redis |

Detection: If `UPSTASH_REDIS_REST_URL` env var exists -> Upstash Redis, otherwise -> SQLite.

## Roadmap

- [x] v4.0 Architecture refactor (SQLite + Monorepo)
- [x] v4.1 Neon glow UI + Memory Matrix + Sync Log + Upstash Redis
- [x] v5.1 Serverless (sql.js) + OpenClaw CLI
- [ ] Vector search for memories (RAG)
- [ ] Automated tweet/weekly report generation

## Contributing

PRs and Issues welcome. Let's build cyber memories for AI together.

## License

[MIT](LICENSE)
