# Changelog

All notable changes will be documented in this file.

## [4.0.0] - 2026-04-02

### Breaking Changes
- **Renamed**: SuperDreams â†?SuperDreams (è¶…æ¢¦)
- **Restructured**: `web/` â†?`agent/`, `superdream-center/` â†?`center/`
- **Storage**: Switched from JSON files to SQLite (better-sqlite3)
- **Archived**: `superdream/` Express server merged into `agent/` Next.js

### Added
- `agent/lib/db.ts` â€?SQLite database layer with Vercel-compatible `/tmp` fallback
- `agent/lib/dream-engine.ts` â€?Real dream engine (scanâ†’extractâ†’deduplicateâ†’scoreâ†’report)
- `agent/lib/health.ts` â€?Data-driven five-dimension health calculator
- `agent/app/api/sync/route.ts` â€?Agentâ†’Center sync endpoint
- `agent/app/api/memories/[id]/route.ts` â€?PUT method for memory updates
- `agent/app/api/health/route.ts` â€?Health history support (`?history=true&days=30`)
- `center/lib/auth.ts` â€?Fixed JWT auth (now signs both agentId AND apiKey)
- `center/lib/db.ts` â€?Added `jwt_secret` column to agents table
- SuperDreams branding across all UI and documentation

### Fixed
- JWT auth bug: `generateToken` now includes `apiKey` in payload
- Control Center auth middleware properly handles both Bearer JWT and ApiKey headers
- Sync routes now use proper auth middleware
- All API endpoints verified working (no 404s)
- Removed dead `lib/api.ts` (wrong types, wrong base URL, wrong endpoints)
- Removed unused `swr` dependency

### Architecture
- Two-tier system: Agent (é¾™è™¾) + Control Center (ä¸­æž¢)
- Agent: Next.js 14 + SQLite for individual agent dashboards
- Center: Next.js 14 + SQLite for multi-agent management
- SQLite per-user: fork-friendly, each user gets their own database
- Dream Engine: real log scanning with deduplication and data-driven health scoring

## [3.1.0] - 2026-04-02

### Refactoring
- Unified type definitions in `web/lib/types.ts`
- Removed dead code (server.js, scripts/dream.ts, scripts/sync.js)
- Fixed next.config.js double-export bug
- Rewrote dream.js with data-driven health calculation
- Refactored dream API route to remove `child_process.exec()` hack

## [3.0.0] - 2026-04-02

### Added
- Next.js 14 full-stack application
- Dashboard with health ring, stats, memories, dreams
- API Routes for CRUD operations
- Dream script for automated memory extraction

## [1.0.0] - 2026-04-02

### Added
- Initial release
- 5-layer memory consolidation
- Health scoring with 5 dimensions
- Dream cycle: collect â†?consolidate â†?evaluate â†?report
