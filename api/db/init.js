import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../db/xiaoxi.db');
const db = new Database(dbPath);

console.log('📦 初始化数据库:', dbPath);

// 创建表
db.exec(`
  -- 健康度记录
  CREATE TABLE IF NOT EXISTS health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    score INTEGER NOT NULL,
    freshness REAL DEFAULT 0,
    coverage REAL DEFAULT 0,
    coherence REAL DEFAULT 0,
    efficiency REAL DEFAULT 0,
    accessibility REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 记忆表
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    importance INTEGER DEFAULT 5,
    tags TEXT DEFAULT '[]',
    source_file TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Dream 历史
  CREATE TABLE IF NOT EXISTS dreams (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    health_score INTEGER,
    scanned_files INTEGER DEFAULT 0,
    new_entries INTEGER DEFAULT 0,
    updated_entries INTEGER DEFAULT 0,
    report TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
  CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
  CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(date);
`);

console.log('✅ 数据表创建完成');

// 插入示例数据
const insertHealth = db.prepare(`
  INSERT OR REPLACE INTO health_metrics (date, score, freshness, coverage, coherence, efficiency, accessibility)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date().toISOString().split('T')[0];
insertHealth.run(today, 82, 0.75, 0.80, 0.72, 0.85, 0.78);

console.log('✅ 健康度数据已插入');

// 插入示例记忆
const insertMemory = db.prepare(`
  INSERT INTO memories (id, type, name, summary, importance, tags)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const memories = [
  ['mem_001', 'lesson', 'openclaw config set 比手动编辑更安全', '使用 openclaw config set 比手动编辑 openclaw.json 更安全，因为会自动创建 .bak 备份文件。', 8, '["openclaw", "安全"]'],
  ['mem_002', 'project', 'xiaoxi-dreams v3.0 发布', '小溪的认知记忆系统升级到 v3.0，使用 SQLite + Next.js + Express 完整架构。', 9, '["xiaoxi-dreams", "发布"]'],
  ['mem_003', 'decision', '使用 Vercel + Railway 部署', '决定使用 Vercel 部署前端，Railway 部署后端，SQLite 作为数据库。', 7, '["vercel", "railway", "部署"]'],
  ['mem_004', 'lesson', 'Tailwind CSS 使用标准颜色', '不要使用自定义颜色如 bg-bg-card，应使用 bg-zinc-900 等标准 Tailwind 颜色。', 8, '["tailwind", "css"]'],
  ['mem_005', 'fact', 'AI Agent 需要记忆系统', 'AI Agent 如果没有记忆系统，每次都是从零开始，无法积累经验和知识。', 9, '["ai", "memory"]'],
];

for (const mem of memories) {
  insertMemory.run(...mem);
}

console.log('✅ 示例记忆已插入');

// 插入 Dream 历史
const insertDream = db.prepare(`
  INSERT INTO dreams (id, date, status, health_score, scanned_files, new_entries, updated_entries, report)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const dreams = [
  ['dream_001', today, 'completed', 82, 24, 3, 5, 'Dream 完成，健康度提升'],
  ['dream_002', '2026-04-01', 'completed', 77, 18, 2, 3, 'Dream 完成，覆盖度略有下降'],
  ['dream_003', '2026-03-31', 'completed', 80, 21, 4, 2, 'Dream 完成，记忆整合良好'],
];

for (const dream of dreams) {
  insertDream.run(...dream);
}

console.log('✅ Dream 历史已插入');

// 关闭数据库
db.close();

console.log('🎉 数据库初始化完成！');
