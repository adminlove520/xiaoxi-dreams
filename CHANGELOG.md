# Changelog

All notable changes will be documented in this file.

## [5.1.1] - 2026-04-03

### Added
- **OpenClaw CLI** — Introduced the `openclaw` NPM package for managing SuperDreams Agents via command line. Features include remote configuration, manual dream triggering, synchronization, and health stats.
- **NPM Publish Workflow** — Added automatic NPM publishing to GitHub Actions release workflow.

## [5.1.0] - 2026-04-03

### Added
- **npm Workspaces** — Root `package.json` now manages `agent` and `center` as workspaces for unified dependency management.
- **Production Default URL** — Set default Control Center sync URL to `https://xiaoxi-dreams.vercel.app` in Agent Dashboard.

### Changed
- **Serverless Migration (Center)** — Replaced `better-sqlite3` with `sql.js` (WASM) in Control Center to support Vercel Serverless environment.
- **Unified DB Engine** — Both Agent and Center now use the same `sql.js` + WASM architecture for maximum cross-platform compatibility.
- **Next.js Config Optimization** — Optimized `webpack` externals in `next.config.js` for proper WASM handling in both projects.

### Fixed
- **Vercel Build Compatibility** — Resolved "better-sqlite3 not found" and "native module" errors during Vercel deployments.
- **TypeScript Store Errors** — Fixed type mismatch and generic issues in `center/lib/store.ts`.
- **Git Identity** — Corrected Git author information for Vercel deployment consistency.

## [4.1.1] - 2026-04-02

### Added
- **Upstash Redis storage** — Agent `store.ts` auto-detects `UPSTASH_REDIS_REST_URL` and switches between Redis (production) and SQLite (development)
- **Documentation** — Added `docs/architecture.md`, `docs/data-flow.md`, `docs/agent-guide.md`, `docs/center-guide.md`
- **SuperDreams Agent Skill** — `SKILLS/superdreams-agent.md` for AI agents to manage memories via API
- **`.env.example`** files for both agent and center with English documentation

### Changed
- **Replaced `@vercel/kv` with `@upstash/redis`** — Both agent and center migrated (deprecated package)
- **All API routes** now import from `store.ts` instead of `db.ts` directly
- **Agent Redis keys** use `sd:` prefix, Center uses `ctr:` prefix
- **ARCHITECTURE.md** rewritten in English with ASCII diagrams (v4.1 storage layer, UI system)
- **README.md** updated with documentation links, storage section, dual-backend info

### Fixed
- Root `package.json` Next.js version pinned to exact `14.2.35` (no ^ prefix)
- Root build script: `cd agent && npm install && npm run build` (Vercel subdirectory install)
- `sql.js` initSqlJs type error fixed with `as any` cast
- 8 Markdown files with Unicode encoding corruption (Windows GBK) rewritten
- Center `store.ts` TypeScript: `redis.get<Type>()` changed to `(await redis.get(key)) as Type`
- Removed unused imports (`Database` from page.tsx, `Link` from SyncSettings.tsx)

## [4.1.0] - 2026-04-02

### Added
- **Neon Glow UI** — Enhanced agent dashboard with neon glow effects, animated borders, gradient text shadows
- **Memory Matrix** — New `MemoryMatrix` component visualizing memory type distribution with animated bars
- **Sync Log** — New `SyncLog` component displaying sync history with status indicators
- **Sync Log DB** — Added `sync_log` table to agent SQLite for persistent sync tracking
- **Sync Log API** — `GET /api/sync?action=logs` endpoint for retrieving sync history
- **Vercel KV** — Control Center supports Vercel KV as persistent store (auto-detects via env vars)
- **`.env.example`** — Added environment variable documentation for Center

### Enhanced
- **CSS Theme** — Complete overhaul of agent `globals.css` with neon glow system (`.neon-text-*`, `.neon-card`, `.neon-btn`, `.ambient-glow`, `.grid-bg`)
- **Text Contrast** — Improved readability with `.text-bright`, `.text-medium`, `.text-dim`, `.text-muted` utility classes
- **All Components** — Updated HealthRing, StatsGrid, RecentDreams, RecentMemories, SyncSettings with neon styling
- **Tailwind Config** — Extended with neon color palette, custom box shadows, and animation utilities
- **Header** — Added neon glow effect to header with subtle green border

### Fixed
- `SyncSettings` used `useState` for initialization instead of `useEffect` (corrected)
- Sync route now logs all sync operations to the sync_log table

## [4.0.0] - 2026-04-02

### Breaking Changes
- **Renamed**: xiaoxi-dreams → SuperDreams (超梦)
- **Restructured**: `agent/` (from `web/`), `center/` (from `superdream-center/`)
- **Storage**: Switched from JSON files to SQLite (sql.js for agent, better-sqlite3 for center)
- **Archived**: `superdream/` Express server merged into `agent/` Next.js
- **Branding**: Full rebranding to SuperDreams (超梦) across all UI and docs

### Added
- `agent/lib/db.ts` — SQLite database layer with Vercel-compatible `/tmp` fallback
- `agent/lib/dream-engine.ts` — Real dream engine (scan→extract→deduplicate→score→report)
- `agent/lib/health.ts` — Data-driven five-dimension health calculator
- `agent/app/api/sync/route.ts` — Agent→Center sync endpoint
- `agent/app/api/memories/[id]/route.ts` — PUT method for memory updates
- `agent/app/api/health/route.ts` — Health history support (?history=true&days=30)
- `center/lib/auth.ts` — Fixed JWT auth (now signs both agentId AND apiKey)
- `center/lib/db.ts` — Added `jwt_secret` column to agents table

### Fixed
- JWT auth bug: `generateToken` now includes `apiKey` in payload
- Control Center auth middleware properly handles both Bearer JWT and ApiKey headers
- Sync routes now use proper auth middleware
- All API endpoints verified working (no 404s)
- Removed dead `lib/api.ts` (wrong types, wrong base URL, wrong endpoints)
- Removed unused `swr` dependency
- Fixed Next.js 14.2+ `serverExternalPackages` config warning
- Fixed Vercel 500 error due to case-sensitive pathing and WASM loading issues
