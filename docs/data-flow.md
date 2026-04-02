# SuperDreams Data Flow

## 1. Memory Upload Flow

```
User / AI Agent
       |
       v
POST /api/memories
  { name, type, summary, content, importance, tags, source }
       |
       v
+------+------+
|  Validation |  Check: name required, type must be valid
+------+------+
       |
       v
+------+------+
| ID Generation|  Format: mem_{timestamp}_{random4}
+------+------+
       |
       v
+------+------+
|  store.ts   |  Auto-detect backend
+------+------+
       |
   +---+---+
   |       |
   v       v
 Redis   SQLite
sd:memory:{id}   INSERT INTO memories
sd:memories:ids  (id, name, type, ...)
       |
       v
  201 Created
  { id, name, type, ... }
```

### Memory Types

| Type | When to Use | Importance |
|------|-------------|------------|
| lesson | Learned from mistakes or experience | 7-9 |
| decision | Important choices and their reasoning | 6-8 |
| fact | Objective information to remember | 4-7 |
| procedure | Step-by-step processes | 5-7 |
| person | Information about people | 5-8 |
| project | Project status and milestones | 6-8 |

---

## 2. Dream Flow

Dreaming = Scan logs --> Extract knowledge --> Consolidate memories --> Score health

```
POST /api/dreams
       |
       v
+------+------+
| dream-engine|
| .ts         |
+------+------+
       |
       v
Step 1: Scan memory/ directory
       |  Find all .md log files
       v
Step 2: LLM Extraction
       |  Parse each log file
       |  Extract: lessons, decisions, facts
       v
Step 3: Deduplication
       |  memoryDb.existsByName(name)
       |  Skip if already exists
       v
Step 4: Create Memories
       |  memoryDb.create() for each new entry
       v
Step 5: Calculate Health Score
       |  5 dimensions (see Section 3)
       v
Step 6: Save Health Record
       |  healthDb.create({ score, dimensions })
       v
Step 7: Update Dream Status
       |  dreamDb.complete(id, results)
       v
Step 8: Return Report
       |
       v
  200 OK
  {
    dream: {
      id, status: "completed",
      health_score: 82,
      scanned_files: 5,
      new_entries: 3,
      report: "## Dream Report\n..."
    }
  }
```

---

## 3. Health Score Calculation

### 5 Dimensions

```
+---------------+--------+----------------------------------------+
| Dimension     | Weight | Measures                               |
+---------------+--------+----------------------------------------+
| freshness     | 20%    | How recent are the memories            |
|               |        | (exponential decay over 30 days)       |
+---------------+--------+----------------------------------------+
| coverage      | 20%    | Distribution across memory types       |
|               |        | (more types covered = higher score)    |
+---------------+--------+----------------------------------------+
| coherence     | 20%    | Connections between memories           |
|               |        | (shared tags, related entries)         |
+---------------+--------+----------------------------------------+
| efficiency    | 20%    | Quality of memories                    |
|               |        | (importance-weighted density)          |
+---------------+--------+----------------------------------------+
| accessibility | 20%    | Ease of retrieval                      |
|               |        | (tag coverage, search completeness)    |
+---------------+--------+----------------------------------------+
```

### Formula

```
dimension_score = 0.0 to 1.0

final_score = (freshness * 0.20
             + coverage * 0.20
             + coherence * 0.20
             + efficiency * 0.20
             + accessibility * 0.20) * 100

Result: 0-100 integer score
```

### Health Status

| Score | Status |
|-------|--------|
| 80-100 | Healthy (green) |
| 60-79 | Good (blue) |
| 40-59 | Fair (yellow) |
| 0-39 | Needs attention (red) |

---

## 4. Sync Flow (Agent --> Center)

```
POST /api/sync { centerUrl, apiKey }
       |
       v
+------+------+
| Fetch all   |  memoryDb.getAll()
| memories    |
+------+------+
       |
       v
+------+------+
| POST to     |  fetch(centerUrl + /api/sync/memory)
| Center      |  Authorization: Bearer {apiKey}
| /sync/memory|  Body: { agentId, agentName, memories }
+------+------+
       |
   +---+---+
   |       |
 200 OK  Error
   |       |
   v       v
+------+ +------+
| Log  | | Log  |
| OK   | | FAIL |
+------+ +------+
       |
       v
+------+------+
| Fetch all   |  dreamDb.getAll()
| dreams      |
+------+------+
       |
       v
+------+------+
| POST to     |  fetch(centerUrl + /api/sync/dream)
| Center      |  Authorization: Bearer {apiKey}
| /sync/dream |  Body: { agentId, agentName, dreams }
+------+------+
       |
       v
+------+------+
| Log result  |  syncLogDb.create()
+------+------+
       |
       v
  200 OK
  {
    success: true,
    memories: { sent: 42, status: 200 },
    dreams: { sent: 5, status: 200 }
  }
```

### Center Receiving Side

```
POST /api/sync/memory (Center)
       |
       v
+------+------+
| Verify auth |  Check Authorization header
+------+------+
       |
       v
+------+------+
| Store each  |  ctr:memory:{id} --> Redis/SQLite
| memory      |  Update ctr:agents:index
+------+------+
       |
       v
  200 OK { received: 42 }
```

---

## 5. Storage Auto-Detection

```
store.ts initialization
       |
       v
  UPSTASH_REDIS_REST_URL exists?
       |
   +---+---+
   |       |
  Yes      No
   |       |
   v       v
  KV_REST_API_URL    No Redis env vars
  exists? (legacy)
   |       |
  Yes      No
   |       |
   v       v
Create Redis      Import db.ts
client            Use SQLite
   |              implementations
   v                    |
Use KV                  v
implementations   sql.js (agent)
   |              better-sqlite3 (center)
   v
Export: memoryDb, healthDb, dreamDb, syncLogDb, getStats
```

---

## 6. Data Models

### Memory

```
{
  id: string,          // "mem_1712034567890"
  name: string,        // Title
  type: MemoryType,    // lesson | decision | fact | procedure | person | project
  summary: string,     // One-line summary
  content: string,     // Full content
  importance: number,  // 1-10
  tags: string[],      // ["tag1", "tag2"]
  source: string,      // "daily-log" | "manual" | "dream"
  created_at: string,  // ISO 8601
  updated_at: string   // ISO 8601
}
```

### Dream

```
{
  id: string,              // "dream_xxx"
  status: string,          // "running" | "completed" | "failed"
  started_at: string,      // ISO 8601
  completed_at: string?,   // ISO 8601
  health_score: number?,   // 0-100
  scanned_files: number?,
  new_entries: number?,
  updated_entries: number?,
  report: string?          // Markdown report
}
```

### Health

```
{
  id: number,
  score: number,           // 0-100
  dimensions: {
    freshness: number,     // 0.0 - 1.0
    coverage: number,
    coherence: number,
    efficiency: number,
    accessibility: number
  },
  created_at: string       // ISO 8601
}
```

### Stats

```
{
  memories: number,        // Total memory count
  dreams: number,          // Total dream count
  avgHealth: number,       // Latest health score
  connections: number,     // Total tag count
  typeDistribution: {      // Count per type
    lesson: number,
    decision: number,
    fact: number,
    ...
  }
}
```
