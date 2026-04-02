# SuperDreams Center - Usage Guide

## 1. Overview

Center is the multi-agent control hub for SuperDreams. Features:

- **Agent Registry** - Register and manage multiple AI agents
- **Memory Aggregation** - Receive and store memories from all agents
- **Dream Collection** - Aggregate dream reports from all agents
- **Cross-Agent Search** - Search across all agents' memories
- **Dashboard** - Global view of all agents' health and activity

---

## 2. Deployment

### Local Development

```bash
cd center
npm install
npm run dev
# Visit http://localhost:3001
```

Data is stored in local SQLite (better-sqlite3) at `center/data/center.db`.

### Vercel Deployment

| Setting | Value |
|---------|-------|
| Root Directory | `center` |
| Build Command | `npm run build` |
| Framework | Next.js |

**Note**: The Center is deployed as a **separate** Vercel project from the Agent.

---

## 3. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| JWT_SECRET | Yes | - | Secret for API key generation and verification |
| UPSTASH_REDIS_REST_URL | Production | - | Upstash Redis REST URL |
| UPSTASH_REDIS_REST_TOKEN | Production | - | Upstash Redis REST token |
| DATABASE_PATH | No | `./data/center.db` | SQLite database path (dev only) |

### Legacy Variables (supported for backward compatibility)

| Variable | Maps To |
|----------|---------|
| KV_REST_API_URL | UPSTASH_REDIS_REST_URL |
| KV_REST_API_TOKEN | UPSTASH_REDIS_REST_TOKEN |

---

## 4. API Reference

### Agent Registration

**POST /api/agents** - Register a new agent

```json
{
  "name": "openclaw",
  "description": "AI Lobster agent"
}
```

Response:

```json
{
  "id": "agent_xxx",
  "name": "openclaw",
  "apiKey": "eyJhbG...",
  "created_at": "2026-04-02T00:00:00Z"
}
```

**GET /api/agents** - List all agents

**GET /api/agents/:id** - Get agent details

### Sync Endpoints (Called by Agents)

**POST /api/sync/memory** - Receive memories from an agent

Headers: `Authorization: Bearer <apiKey>`

```json
{
  "agentId": "agent_xxx",
  "agentName": "openclaw",
  "memories": [
    { "id": "mem_xxx", "name": "...", "type": "lesson", ... }
  ]
}
```

**POST /api/sync/dream** - Receive dreams from an agent

Headers: `Authorization: Bearer <apiKey>`

```json
{
  "agentId": "agent_xxx",
  "agentName": "openclaw",
  "dreams": [
    { "id": "dream_xxx", "status": "completed", ... }
  ]
}
```

### Dashboard

**GET /api/dashboard** - Aggregated statistics

Response:

```json
{
  "agents": 3,
  "totalMemories": 128,
  "totalDreams": 15,
  "avgHealth": 78,
  "recentActivity": [...]
}
```

---

## 5. Authentication

Center uses JWT-based authentication for agent sync:

1. When an agent registers, the Center generates an API key (JWT signed with `JWT_SECRET`)
2. The agent stores this API key in its SyncSettings
3. On sync, the agent sends: `Authorization: Bearer <apiKey>`
4. The Center verifies the JWT signature

### Security Recommendations

- Use a strong `JWT_SECRET` (at least 32 characters)
- Do not expose `JWT_SECRET` in client-side code
- Use HTTPS for all sync communication

---

## 6. Sync Setup

### Step 1: Deploy Center

Deploy the Center to Vercel (or run locally).

### Step 2: Register Agent in Center

```bash
curl -X POST https://your-center.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "openclaw", "description": "My AI agent"}'
```

Save the returned `apiKey`.

### Step 3: Configure Agent Sync Settings

In the Agent Dashboard:
1. Go to the main page
2. Find the "Sync Settings" card
3. Enter:
   - **Center URL**: `https://your-center.vercel.app`
   - **API Key**: (the key from step 2)
4. Click "Save"

### Step 4: Trigger Sync

Click "Sync Now" in the Agent Dashboard, or call:

```bash
curl -X POST https://your-agent.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "centerUrl": "https://your-center.vercel.app",
    "apiKey": "eyJhbG..."
  }'
```

### Step 5: Verify

Check the Center Dashboard. The agent should appear with its synced memories and dreams.

---

## 7. Storage

### Redis Key Schema

Center uses `ctr:` prefix for all Redis keys:

| Key | Type | Description |
|-----|------|-------------|
| ctr:agent:{id} | JSON | Agent registration info |
| ctr:agents:index | string[] | All agent IDs |
| ctr:memory:{id} | JSON | Synced memory (from any agent) |
| ctr:memories:ids | string[] | All memory IDs |
| ctr:dream:{id} | JSON | Synced dream |
| ctr:dreams:ids | string[] | All dream IDs |
| ctr:synclog:{id} | JSON | Sync log entry |
| ctr:synclogs:ids | string[] | All sync log IDs |

### SQLite Tables (local development)

| Table | Description |
|-------|-------------|
| agents | Agent registry (id, name, description, api_key, last_sync) |
| memories | Synced memories (same schema as agent + agent_id field) |
| dreams | Synced dreams (same schema as agent + agent_id field) |
| sync_logs | Incoming sync history (agent_id, status, count, timestamp) |

---

## 8. Multi-Agent Architecture

```
+-- Agent A (openclaw) --+
|  Dashboard + API       |---+
|  Upstash Redis (sd:)   |   |
+------------------------+   |
                              |  POST /api/sync
+-- Agent B (other) -----+   |
|  Dashboard + API       |---+----> +-- Center ---------+
|  SQLite (local dev)    |   |      |  Dashboard + API  |
+------------------------+   |      |  Redis (ctr:)     |
                              |      +-------------------+
+-- Agent C (future) ----+   |
|  Dashboard + API       |---+
|  Upstash Redis (sd:)   |
+------------------------+
```

Each agent:
- Operates independently with its own storage
- Has its own deployment URL
- Syncs to Center on demand (not real-time)

Center:
- Aggregates data from all agents
- Provides global search
- Shows comparative health dashboards
- Each agent's data is tagged with `agent_id`

---

## 9. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Sync returns 401 | Invalid API key | Re-register agent and get new key |
| Agent not showing in dashboard | Sync never ran | Trigger manual sync from agent |
| Data lost after restart | No Upstash Redis | Configure `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| JWT_SECRET not set | Missing env var | Add to Vercel Environment Variables |
| CORS error on sync | Cross-origin blocked | Center API routes should include CORS headers |
| Old @vercel/kv errors | Deprecated package | Both apps now use @upstash/redis |
