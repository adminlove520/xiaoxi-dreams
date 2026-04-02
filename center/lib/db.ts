import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'center.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = db;
  
  // Agents table
  // Updated with jwt_secret column
  database.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT DEFAULT 'lobster',
      api_key TEXT UNIQUE NOT NULL,
      jwt_secret TEXT,
      status TEXT DEFAULT 'offline',
      last_heartbeat TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for existing tables to add jwt_secret if it doesn't exist
  try {
    const columns = database.prepare("PRAGMA table_info(agents)").all() as any[];
    if (!columns.find(c => c.name === 'jwt_secret')) {
      database.exec("ALTER TABLE agents ADD COLUMN jwt_secret TEXT");
    }
  } catch (e) {
    console.error("Migration error:", e);
  }

  // Memory index table
  database.exec(`
    CREATE TABLE IF NOT EXISTS memory_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      digest TEXT NOT NULL,
      type TEXT NOT NULL,
      importance INTEGER DEFAULT 5,
      tags TEXT,
      memory_uuid TEXT NOT NULL,
      content_preview TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Dream index table
  database.exec(`
    CREATE TABLE IF NOT EXISTS dream_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      summary TEXT,
      status TEXT DEFAULT 'pending',
      memories_created INTEGER DEFAULT 0,
      dreamed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Sync log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      status TEXT DEFAULT 'success',
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_index(agent_id);
    CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_index(type);
    CREATE INDEX IF NOT EXISTS idx_dream_agent ON dream_index(agent_id);
    CREATE INDEX IF NOT EXISTS idx_sync_log_agent ON sync_log(agent_id);
  `);
}

export interface Agent {
  id: string;
  name: string;
  species: string;
  api_key: string;
  jwt_secret: string | null;
  status: string;
  last_heartbeat: string | null;
  created_at: string;
}

export interface MemoryIndex {
  id: number;
  agent_id: string;
  digest: string;
  type: string;
  importance: number;
  tags: string | null;
  memory_uuid: string;
  content_preview: string | null;
  created_at: string;
}

export interface DreamIndex {
  id: number;
  agent_id: string;
  summary: string | null;
  status: string;
  memories_created: number;
  dreamed_at: string;
}
