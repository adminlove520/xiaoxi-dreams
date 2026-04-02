import initSqlJs from 'sql.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import type { Memory, Health, Dream, Stats, HealthDimensions } from './types'

// ---------- 数据库初始化 ----------
const IS_VERCEL = process.env.VERCEL === '1'
const DB_NAME = 'superdreams.db'

function getDbPath(): string {
  if (IS_VERCEL) {
    const tmpPath = path.join('/tmp', DB_NAME)
    if (!fs.existsSync(tmpPath)) {
      const srcPath = path.join(process.cwd(), 'data', DB_NAME)
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, tmpPath)
      }
    }
    return tmpPath
  }
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return path.join(dataDir, DB_NAME)
}

let _db: SqlJsDatabase | null = null
let _dbPath: string = ''

function saveDb() {
  if (_db && _dbPath) {
    const data = _db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(_dbPath, buffer)
  }
}

async function getDb(): Promise<SqlJsDatabase> {
  if (_db) return _db

  try {
    // 尝试定位 WASM 文件 (兼容各种运行路径)
    const possiblePaths = [
      path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
      path.resolve(process.cwd(), 'agent/node_modules/sql.js/dist/sql-wasm.wasm'),
      path.join(process.cwd(), '../node_modules/sql.js/dist/sql-wasm.wasm')
    ]
    
    let wasmBinary: Buffer | undefined
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        wasmBinary = fs.readFileSync(p)
        break
      }
    }

    const SQL = await initSqlJs(wasmBinary ? { wasmBinary } : {})
    _dbPath = getDbPath()

    if (fs.existsSync(_dbPath)) {
      const fileBuffer = fs.readFileSync(_dbPath)
      _db = new SQL.Database(fileBuffer)
    } else {
      _db = new SQL.Database()
    }

    initSchema(_db)
    saveDb()
    return _db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// 同步版本 — 仅在已初始化后使用
function getDbSync(): SqlJsDatabase {
  if (!_db) throw new Error('Database not initialized. Call getDb() first.')
  return _db
}

function initSchema(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('lesson','decision','fact','procedure','person','project')),
      name TEXT NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      importance INTEGER DEFAULT 5 CHECK(importance >= 1 AND importance <= 10),
      tags TEXT DEFAULT '[]',
      source TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
      status TEXT NOT NULL CHECK(status IN ('healthy','warning','critical','unknown')),
      dimensions TEXT DEFAULT '{}',
      trend TEXT DEFAULT 'stable' CHECK(trend IN ('up','down','stable')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS dreams (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
      health_score INTEGER,
      scanned_files INTEGER DEFAULT 0,
      new_entries INTEGER DEFAULT 0,
      updated_entries INTEGER DEFAULT 0,
      report TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `)

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)')
  db.run('CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_health_date ON health(date DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(date DESC)')
}

// ---------- 查询辅助函数 ----------
function queryAll(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function queryOne(db: SqlJsDatabase, sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

function runSql(db: SqlJsDatabase, sql: string, params: any[] = []): number {
  db.run(sql, params)
  return db.getRowsModified()
}

// ---------- 记忆操作 ----------
export const memoryDb = {
  async getAll(params?: { type?: string; limit?: number; offset?: number; search?: string }): Promise<{ memories: Memory[]; total: number }> {
    const db = await getDb()
    const conditions: string[] = []
    const values: any[] = []

    if (params?.type) {
      conditions.push('type = ?')
      values.push(params.type)
    }
    if (params?.search) {
      conditions.push('(name LIKE ? OR summary LIKE ? OR tags LIKE ?)')
      const q = `%${params.search}%`
      values.push(q, q, q)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const countRow = queryOne(db, `SELECT COUNT(*) as count FROM memories ${where}`, values)
    const total = countRow?.count || 0

    const limit = params?.limit || 50
    const offset = params?.offset || 0
    const rows = queryAll(db, `SELECT * FROM memories ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, limit, offset])

    const memories = rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
    }))

    return { memories, total }
  },

  async getById(id: string): Promise<Memory | null> {
    const db = await getDb()
    const row = queryOne(db, 'SELECT * FROM memories WHERE id = ?', [id])
    if (!row) return null
    return { ...row, tags: JSON.parse(row.tags || '[]') }
  },

  async create(memory: Omit<Memory, 'created_at' | 'updated_at'>): Promise<Memory> {
    const db = await getDb()
    const now = new Date().toISOString()
    runSql(db, `
      INSERT INTO memories (id, type, name, summary, content, importance, tags, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memory.id, memory.type, memory.name, memory.summary || memory.name,
      memory.content || '', memory.importance || 5,
      JSON.stringify(memory.tags || []), memory.source || '', now, now
    ])
    saveDb()
    return { ...memory, tags: memory.tags || [], created_at: now, updated_at: now } as Memory
  },

  async createMany(memories: Omit<Memory, 'created_at' | 'updated_at'>[]): Promise<number> {
    const db = await getDb()
    const now = new Date().toISOString()
    let count = 0
    for (const m of memories) {
      try {
        runSql(db, `
          INSERT OR IGNORE INTO memories (id, type, name, summary, content, importance, tags, source, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          m.id, m.type, m.name, m.summary || m.name,
          m.content || '', m.importance || 5,
          JSON.stringify(m.tags || []), m.source || '', now, now
        ])
        if (db.getRowsModified() > 0) count++
      } catch { /* ignore duplicate */ }
    }
    saveDb()
    return count
  },

  async update(id: string, updates: Partial<Memory>): Promise<boolean> {
    const db = await getDb()
    const sets: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name) }
    if (updates.summary !== undefined) { sets.push('summary = ?'); values.push(updates.summary) }
    if (updates.content !== undefined) { sets.push('content = ?'); values.push(updates.content) }
    if (updates.importance !== undefined) { sets.push('importance = ?'); values.push(updates.importance) }
    if (updates.tags !== undefined) { sets.push('tags = ?'); values.push(JSON.stringify(updates.tags)) }
    if (updates.type !== undefined) { sets.push('type = ?'); values.push(updates.type) }

    if (sets.length === 0) return false
    sets.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const changes = runSql(db, `UPDATE memories SET ${sets.join(', ')} WHERE id = ?`, values)
    saveDb()
    return changes > 0
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const changes = runSql(db, 'DELETE FROM memories WHERE id = ?', [id])
    saveDb()
    return changes > 0
  },

  async stats(): Promise<{ total: number; byType: Record<string, number> }> {
    const db = await getDb()
    const totalRow = queryOne(db, 'SELECT COUNT(*) as count FROM memories')
    const total = totalRow?.count || 0
    const byType: Record<string, number> = {}
    const rows = queryAll(db, 'SELECT type, COUNT(*) as count FROM memories GROUP BY type')
    for (const r of rows) byType[r.type] = r.count
    return { total, byType }
  },

  async existsByName(name: string): Promise<boolean> {
    const db = await getDb()
    const row = queryOne(db, 'SELECT 1 as found FROM memories WHERE name = ?', [name])
    return !!row
  },
}

// ---------- 健康度操作 ----------
export const healthDb = {
  async getLatest(): Promise<Health | null> {
    const db = await getDb()
    const row = queryOne(db, 'SELECT * FROM health ORDER BY created_at DESC LIMIT 1')
    if (!row) return null
    return { ...row, dimensions: JSON.parse(row.dimensions || '{}') }
  },

  async getHistory(days: number = 30): Promise<Health[]> {
    const db = await getDb()
    const rows = queryAll(db, 'SELECT * FROM health ORDER BY date DESC LIMIT ?', [days])
    return rows.map(r => ({ ...r, dimensions: JSON.parse(r.dimensions || '{}') }))
  },

  async create(health: Omit<Health, 'id' | 'created_at'>): Promise<void> {
    const db = await getDb()
    runSql(db, `
      INSERT INTO health (date, score, status, dimensions, trend)
      VALUES (?, ?, ?, ?, ?)
    `, [
      health.date, health.score, health.status,
      JSON.stringify(health.dimensions), health.trend
    ])
    saveDb()
  },
}

// ---------- 做梦记录操作 ----------
export const dreamDb = {
  async getAll(limit: number = 20): Promise<Dream[]> {
    const db = await getDb()
    return queryAll(db, 'SELECT * FROM dreams ORDER BY started_at DESC LIMIT ?', [limit]) as Dream[]
  },

  async getById(id: string): Promise<Dream | null> {
    const db = await getDb()
    return queryOne(db, 'SELECT * FROM dreams WHERE id = ?', [id]) as Dream | null
  },

  async create(dream: Omit<Dream, 'completed_at'>): Promise<Dream> {
    const db = await getDb()
    runSql(db, `
      INSERT INTO dreams (id, date, status, health_score, scanned_files, new_entries, updated_entries, report, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dream.id, dream.date, dream.status, dream.health_score,
      dream.scanned_files, dream.new_entries, dream.updated_entries,
      dream.report, dream.started_at
    ])
    saveDb()
    return { ...dream, completed_at: null }
  },

  async complete(id: string, result: { health_score: number; scanned_files: number; new_entries: number; updated_entries: number; report: string }): Promise<void> {
    const db = await getDb()
    runSql(db, `
      UPDATE dreams SET status = 'completed', health_score = ?, scanned_files = ?, new_entries = ?, updated_entries = ?, report = ?, completed_at = ?
      WHERE id = ?
    `, [result.health_score, result.scanned_files, result.new_entries, result.updated_entries, result.report, new Date().toISOString(), id])
    saveDb()
  },

  async fail(id: string, reason: string): Promise<void> {
    const db = await getDb()
    runSql(db, 'UPDATE dreams SET status = \'failed\', report = ?, completed_at = ? WHERE id = ?',
      [reason, new Date().toISOString(), id])
    saveDb()
  },
}

// ---------- 统计 ----------
export async function getStats(): Promise<Stats> {
  const db = await getDb()
  const memRow = queryOne(db, 'SELECT COUNT(*) as c FROM memories')
  const memCount = memRow?.c || 0
  const dreamRow = queryOne(db, 'SELECT COUNT(*) as c FROM dreams')
  const dreamCount = dreamRow?.c || 0
  const health = await healthDb.getLatest()

  const tagRows = queryAll(db, 'SELECT tags FROM memories')
  let totalTags = 0
  for (const r of tagRows) {
    try { totalTags += JSON.parse(r.tags || '[]').length } catch {}
  }

  const typeRows = queryAll(db, 'SELECT type, COUNT(*) as c FROM memories GROUP BY type')
  const typeDistribution: Record<string, number> = {}
  for (const r of typeRows) typeDistribution[r.type] = r.c

  return {
    memories: memCount,
    dreams: dreamCount,
    avgHealth: health?.score || 0,
    connections: totalTags,
    typeDistribution,
  }
}

// 导出用于 dream-engine 的底层查询接口
export async function queryDbAll(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDb()
  return queryAll(db, sql, params)
}

export async function queryDbOne(sql: string, params: any[] = []): Promise<any | null> {
  const db = await getDb()
  return queryOne(db, sql, params)
}

export default getDb
