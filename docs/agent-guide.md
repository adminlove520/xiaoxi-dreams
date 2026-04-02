# SuperDreams Agent - Usage Guide

## 1. Overview

Agent Dashboard is the individual AI agent's cognitive memory management interface. Features:

- **Memory Management** - Create, read, update, delete, and search memories
- **Dream Triggering** - Consolidate daily logs into long-term memories
- **Health Monitoring** - 5-dimension cognitive health scoring
- **Sync to Center** - Upload data to the multi-agent control center
- **Neon Glow UI** - Cyberpunk-themed dashboard with glow effects and animations

---

## 2. Deployment

### Local Development

```bash
cd agent
npm install
npm run dev
# Visit http://localhost:3000
```

Data is stored in local SQLite (sql.js WASM) at `agent/data/superdreams.db`.

### Vercel Deployment

The project uses a monorepo structure. Vercel configuration:

| Setting | Value |
|---------|-------|
| Root Directory | (empty, use repo root) |
| Build Command | auto: `npm run build` |
| Output Directory | auto-detected |
| Framework | Next.js (detected from root package.json) |

The root `package.json` build script runs: `cd agent && npm install && npm run build`

**Important**: The root `package.json` must have `"next": "14.2.35"` (exact version, no ^ prefix) in dependencies for Vercel framework detection.

---

## 3. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| UPSTASH_REDIS_REST_URL | Production | Upstash Redis REST URL |
| UPSTASH_REDIS_REST_TOKEN | Production | Upstash Redis REST token |

**Without these variables**, the agent uses local SQLite. On Vercel, SQLite writes to `/tmp` which is lost on cold starts. **Always configure Redis for production.**

### How to set up Upstash Redis on Vercel

1. Go to Vercel Dashboard --> Your Project --> Storage
2. Click "Create Database" --> Choose "Redis" (Upstash)
3. Follow the setup wizard
4. Env vars are automatically injected

Or manually add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Settings --> Environment Variables.

---

## 4. API Reference

### Memories

**POST /api/memories** - Create a memory

```json
{
  "name": "Memory title (required)",
  "type": "lesson",
  "summary": "One-line summary",
  "content": "Detailed content",
  "importance": 7,
  "tags": ["tag1", "tag2"],
  "source": "daily-log"
}
```

Valid types: `lesson`, `decision`, `fact`, `procedure`, `person`, `project`

**GET /api/memories** - List memories

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | all | Filter by memory type |
| search | string | - | Search in name, summary, tags |
| limit | number | 50 | Max results |
| offset | number | 0 | Pagination offset |

**GET /api/memories/:id** - Get single memory

**PUT /api/memories/:id** - Update memory

**DELETE /api/memories/:id** - Delete memory

### Dreams

**POST /api/dreams** - Trigger a dream (no request body needed)

**GET /api/dreams** - Dream history (optional: `?limit=20`)

### Health

**GET /api/health** - Current health score

**GET /api/health?history=true&days=30** - Health history

### Statistics

**GET /api/stats** - Overview statistics

### Sync

**POST /api/sync** - Sync to Center

```json
{
  "centerUrl": "https://your-center.vercel.app",
  "apiKey": "your-api-key"
}
```

**GET /api/sync?action=logs** - Sync history

---

## 5. UI Components

| Component | Description |
|-----------|-------------|
| HealthRing | SVG ring displaying health score (0-100) with color-coded glow |
| StatsGrid | 4-card grid showing memories, dreams, health, connections counts |
| MemoryMatrix | Horizontal bar chart of memory type distribution with color coding |
| SyncLog | Chronological list of sync operations with success/error status |
| RecentDreams | Latest dream cards with health scores and timestamps |
| RecentMemories | Latest memory cards with type indicators and importance |
| SyncSettings | Configuration form for Center URL and API key |

### CSS Theme

The dashboard uses a custom neon glow CSS system:

- `.neon-text-green/blue/purple/cyan` - Glowing text colors
- `.neon-card` / `.neon-card-blue` / `.neon-card-purple` - Glowing card borders
- `.neon-btn` - Glowing buttons
- `.ambient-glow` / `.grid-bg` - Background effects
- `.text-bright/medium/dim/muted` - High-contrast text hierarchy

---

## 6. AI Agent Skill Integration

AI agents (like openclaw) can manage their memories programmatically using the `superdreams-agent` Skill.

### Install the Skill

Copy `SKILLS/superdreams-agent.md` to your agent's skills directory:

```
~/.accio/accounts/{account}/agents/{agent}/agent-core/skills/superdreams-agent/SKILL.md
```

### How the Agent Uses It

The Skill teaches the agent to call SuperDreams APIs via `web_fetch`:

```
# Upload a memory
POST https://your-agent.vercel.app/api/memories
{ "name": "...", "type": "lesson", "importance": 8, ... }

# Trigger dreaming
POST https://your-agent.vercel.app/api/dreams

# Check health
GET https://your-agent.vercel.app/api/health
```

### Trigger Words

The Skill activates on: "upload memory", "save memory", "dream", "health status", "sync", etc.

### Automated Daily Dreams (optional)

Set up a cron job to dream every day at 4 AM:

```javascript
cron.add({
  name: 'Daily Dream',
  schedule: { kind: 'cron', expr: '0 4 * * *', tz: 'Asia/Shanghai' },
  payload: {
    kind: 'agent',
    message: 'Trigger SuperDreams dream: POST /api/dreams'
  }
})
```

---

## 7. Memory Type Guide

| Type | Use When | Example | Suggested Importance |
|------|----------|---------|---------------------|
| lesson | Learning from mistakes or experience | "Never deploy on Friday" | 7-9 |
| decision | Recording important choices | "Chose Next.js over Remix" | 6-8 |
| fact | Storing objective information | "Redis max connections: 10000" | 4-7 |
| procedure | Documenting step-by-step processes | "How to deploy to Vercel" | 5-7 |
| person | Remembering info about people | "User prefers concise replies" | 5-8 |
| project | Tracking project milestones | "SuperDreams v4.1 released" | 6-8 |

### Importance Scale

| Level | Meaning | Retention |
|-------|---------|-----------|
| 1-3 | Low priority, routine | May decay |
| 4-6 | Moderate, reference value | Standard |
| 7-8 | Important, should remember | Long-term |
| 9-10 | Critical, never forget | Permanent |

---

## 8. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Build fails: Turbopack error | Next.js 16 installed | Pin `"next": "14.2.35"` (no ^ prefix) in root package.json |
| Data lost after Vercel restart | No Upstash Redis configured | Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars |
| initSqlJs type error | sql.js strict types | Use `{ wasmBinary } as any` cast in db.ts |
| serverExternalPackages warning | Unrecognized in Next 14 | Harmless, can be ignored |
| Module not found on Vercel | Agent deps not installed | Ensure build script is `cd agent && npm install && npm run build` |
| Sync fails 401 | Wrong API key | Verify apiKey matches Center JWT_SECRET |
