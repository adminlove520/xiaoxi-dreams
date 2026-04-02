/**
 * SuperDreams v4.0 — Dream Script (CLI)
 *
 * 真实做梦：扫描 memory/ 日志 → 提取记忆 → 存入 SQLite → 计算健康度 → 生成报告
 */
const initSqlJs = require('sql.js');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');

// ────────────── 路径 ──────────────
const BASE_DIR = process.cwd();
const DB_PATH = path.join(BASE_DIR, 'agent', 'data', 'superdreams.db');
const MEMORY_DIR = process.argv[2] || path.join(BASE_DIR, 'memory');

// ────────────── 节标题→类型映射 ──────────────
const SECTION_MAP = {
  '教训': 'lesson', 'lessons': 'lesson',
  '决策': 'decision', 'decisions': 'decision',
  '事实': 'fact', 'facts': 'fact',
  '流程': 'procedure', 'procedures': 'procedure',
  '待办': 'procedure', 'todos': 'procedure',
  '项目': 'project', 'projects': 'project',
  '人物': 'person', 'people': 'person',
};

function parseSection(line) {
  const lower = line.toLowerCase().replace(/[#*()\s]/g, '');
  for (const [keyword, type] of Object.entries(SECTION_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return null;
}

function estimateImportance(text) {
  let score = 5;
  if (text.length > 80) score += 1;
  if (text.length > 150) score += 1;
  if (/不要|避免|注意|重要|关键|bug|error|失败|问题/i.test(text)) score += 2;
  if (/决定|选择|方案|策略|计划/i.test(text)) score += 1;
  return Math.min(10, Math.max(1, score));
}

function generateId() {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

// ────────────── 查询辅助 ──────────────
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function saveDb(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fsSync.writeFileSync(DB_PATH, buffer);
}

// ────────────── 初始化数据库 ──────────────
async function initDb() {
  const dir = path.dirname(DB_PATH);
  fsSync.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  let db;

  if (fsSync.existsSync(DB_PATH)) {
    const fileBuffer = fsSync.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      importance INTEGER DEFAULT 5,
      tags TEXT DEFAULT '[]',
      source TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      score INTEGER NOT NULL,
      status TEXT NOT NULL,
      dimensions TEXT DEFAULT '{}',
      trend TEXT DEFAULT 'stable',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS dreams (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      health_score INTEGER,
      scanned_files INTEGER DEFAULT 0,
      new_entries INTEGER DEFAULT 0,
      updated_entries INTEGER DEFAULT 0,
      report TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_health_date ON health(date DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(date DESC)');

  saveDb(db);
  return db;
}

// ────────────── 扫描日志 ──────────────
async function scanLogs(db) {
  const entries = [];
  let scannedFiles = 0;

  try {
    const files = await fs.readdir(MEMORY_DIR);
    const logFiles = files.filter(f => f.endsWith('.md') && !f.includes('dream-log'));

    for (const file of logFiles) {
      scannedFiles++;
      const content = await fs.readFile(path.join(MEMORY_DIR, file), 'utf8');
      const lines = content.split('\n');
      let currentType = null;

      for (const line of lines) {
        if (line.startsWith('#')) {
          const parsed = parseSection(line);
          if (parsed) currentType = parsed;
          continue;
        }

        if (line.startsWith('- ') && currentType) {
          const raw = line.replace(/^- \[.\]\s*/, '').replace(/^- /, '').trim();
          if (!raw || raw.length < 4) continue;
          const exists = queryOne(db, 'SELECT 1 as found FROM memories WHERE name = ?', [raw]);
          if (exists) continue;

          entries.push({
            id: generateId(),
            type: currentType,
            name: raw,
            summary: raw,
            content: raw,
            importance: estimateImportance(raw),
            tags: JSON.stringify([currentType]),
            source: file,
          });
        }
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`  ⚠️ 目录不存在: ${MEMORY_DIR}`);
    } else {
      throw err;
    }
  }

  return { entries, scannedFiles };
}

// ────────────── 健康度计算 ──────────────
function calculateHealth(db, previousHealth) {
  const totalRow = queryOne(db, 'SELECT COUNT(*) as c FROM memories');
  const total = totalRow?.c || 0;
  if (total === 0) {
    return { score: 0, status: 'unknown', dimensions: {}, trend: 'stable' };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentRow = queryOne(db, 'SELECT COUNT(*) as c FROM memories WHERE created_at > ?', [sevenDaysAgo]);
  const recent7d = recentRow?.c || 0;
  const typeRows = queryAll(db, 'SELECT type, COUNT(*) as c FROM memories GROUP BY type');
  const byType = {};
  for (const r of typeRows) byType[r.type] = r.c;
  const avgRow = queryOne(db, 'SELECT AVG(importance) as avg FROM memories');
  const avgImp = avgRow?.avg || 5;

  const lessons = byType['lesson'] || 0;
  const decisions = byType['decision'] || 0;
  const facts = byType['fact'] || 0;
  const procedures = byType['procedure'] || 0;
  const typeVariety = Object.keys(byType).length;

  const freshness = Math.min(100, (recent7d / Math.max(total, 1)) * 60 + total * 3);
  const coverage = Math.min(100, (lessons + decisions) * 8 + typeVariety * 10);
  const coherence = Math.min(100, avgImp * 12);
  const efficiency = Math.min(100, Math.log2(total + 1) * 15);
  const accessibility = Math.min(100, (facts + procedures) * 12);

  const score = Math.round(
    freshness * 0.25 + coverage * 0.25 + coherence * 0.20 +
    efficiency * 0.15 + accessibility * 0.15
  );

  let status = 'unknown';
  if (score >= 70) status = 'healthy';
  else if (score >= 50) status = 'warning';
  else if (score > 0) status = 'critical';

  let trend = 'stable';
  if (previousHealth) {
    if (score > previousHealth.score + 2) trend = 'up';
    else if (score < previousHealth.score - 2) trend = 'down';
  }

  return {
    score, status, trend,
    dimensions: {
      freshness: +(freshness / 100).toFixed(3),
      coverage: +(coverage / 100).toFixed(3),
      coherence: +(coherence / 100).toFixed(3),
      efficiency: +(efficiency / 100).toFixed(3),
      accessibility: +(accessibility / 100).toFixed(3),
    },
  };
}

// ────────────── 主流程 ──────────────
async function run() {
  console.log('🌀 SuperDreams v4.0 | Dream Engine');
  console.log('====================================');
  console.log(`📂 数据库: ${DB_PATH}`);
  console.log(`📂 日志目录: ${MEMORY_DIR}`);
  console.log('');

  const db = await initDb();
  const today = new Date().toISOString().split('T')[0];
  const dreamId = `dream_${Date.now().toString(36)}`;

  try {
    // 1. 创建 dream 记录
    db.run(`INSERT INTO dreams (id, date, status) VALUES (?, ?, 'running')`, [dreamId, today]);
    saveDb(db);

    // 2. 扫描日志
    console.log('🔍 扫描日志文件...');
    const { entries, scannedFiles } = await scanLogs(db);
    console.log(`   发现 ${scannedFiles} 个文件，提取 ${entries.length} 条新记忆`);

    // 3. 批量插入新记忆
    let inserted = 0;
    if (entries.length > 0) {
      for (const m of entries) {
        try {
          db.run(`
            INSERT OR IGNORE INTO memories (id, type, name, summary, content, importance, tags, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [m.id, m.type, m.name, m.summary, m.content, m.importance, m.tags, m.source]);
          if (db.getRowsModified() > 0) inserted++;
        } catch { /* ignore duplicate */ }
      }
      saveDb(db);
      console.log(`   写入 ${inserted} 条记忆到 SQLite`);
    }

    // 4. 计算健康度
    const prevHealth = queryOne(db, 'SELECT * FROM health ORDER BY created_at DESC LIMIT 1');
    const healthResult = calculateHealth(db, prevHealth);

    db.run(`INSERT INTO health (date, score, status, dimensions, trend) VALUES (?, ?, ?, ?, ?)`,
      [today, healthResult.score, healthResult.status, JSON.stringify(healthResult.dimensions), healthResult.trend]);
    saveDb(db);

    // 5. 生成报告
    const totalRow = queryOne(db, 'SELECT COUNT(*) as c FROM memories');
    const total = totalRow?.c || 0;
    const typeRows = queryAll(db, 'SELECT type, COUNT(*) as c FROM memories GROUP BY type');
    const typeBreakdown = typeRows.map(r => `  - ${r.type}: ${r.c}`).join('\n');
    const dim = healthResult.dimensions;

    const report = [
      `## 梦境报告 — ${today}`,
      '', '### 统计',
      `- 扫描: ${scannedFiles} 个文件`,
      `- 新增: ${inserted} 条记忆`,
      `- 总量: ${total} 条`,
      '', '### 记忆分布', typeBreakdown || '  (暂无)',
      '', `### 健康度: ${healthResult.score}/100 (${healthResult.status})`,
      `- 新鲜度: ${((dim.freshness || 0) * 100).toFixed(0)}%`,
      `- 覆盖度: ${((dim.coverage || 0) * 100).toFixed(0)}%`,
      `- 连贯度: ${((dim.coherence || 0) * 100).toFixed(0)}%`,
      `- 效率: ${((dim.efficiency || 0) * 100).toFixed(0)}%`,
      `- 可达性: ${((dim.accessibility || 0) * 100).toFixed(0)}%`,
      '', '---', `*Generated by SuperDreams Dream Engine*`,
    ].join('\n');

    // 6. 更新 dream 记录
    db.run(`UPDATE dreams SET status='completed', health_score=?, scanned_files=?, new_entries=?, report=?, completed_at=? WHERE id=?`,
      [healthResult.score, scannedFiles, inserted, report, new Date().toISOString(), dreamId]);
    saveDb(db);

    // 7. 输出
    console.log('');
    console.log(`✅ Dream 完成！`);
    console.log(`   健康度: ${healthResult.score}/100 (${healthResult.status})`);
    console.log(`   趋势: ${healthResult.trend}`);
    console.log('');
    console.log(report);

    db.close();
  } catch (error) {
    db.run(`UPDATE dreams SET status='failed', report=?, completed_at=? WHERE id=?`,
      [`Error: ${error.message}`, new Date().toISOString(), dreamId]);
    saveDb(db);
    db.close();
    console.error('🔴 Dream 失败:', error);
    process.exit(1);
  }
}

run();
