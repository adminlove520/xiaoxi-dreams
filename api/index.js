import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 18792;

// 数据库路径
const dbPath = join(__dirname, '../db/xiaoxi.db');
const db = new Database(dbPath);

console.log('📦 数据库:', dbPath);

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ========== 健康度 API ==========

// GET /api/health - 当前健康度
app.get('/api/health', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const health = db.prepare(`
      SELECT * FROM health_metrics ORDER BY date DESC LIMIT 1
    `).get();
    
    if (!health) {
      return res.json({ 
        score: 0, 
        status: 'unknown',
        dimensions: {},
        date: null 
      });
    }
    
    res.json({
      score: health.score,
      status: health.score >= 70 ? 'healthy' : health.score >= 50 ? 'warning' : 'critical',
      dimensions: {
        freshness: health.freshness,
        coverage: health.coverage,
        coherence: health.coherence,
        efficiency: health.efficiency,
        accessibility: health.accessibility,
      },
      trend: 'up',
      date: health.date,
    });
  } catch (error) {
    console.error('Health error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/health/history - 健康度历史
app.get('/api/health/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const history = db.prepare(`
      SELECT * FROM health_metrics ORDER BY date DESC LIMIT ?
    `).all(days);
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 记忆 API ==========

// GET /api/memories - 记忆列表
app.get('/api/memories', (req, res) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM memories';
    let countSql = 'SELECT COUNT(*) as total FROM memories';
    const params = [];
    
    if (type) {
      sql += ' WHERE type = ?';
      countSql += ' WHERE type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const memories = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...(type ? [type] : []));
    
    // 解析 tags JSON
    const result = memories.map(m => ({
      ...m,
      tags: JSON.parse(m.tags || '[]'),
    }));
    
    res.json({
      memories: result,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/memories/:id - 记忆详情
app.get('/api/memories/:id', (req, res) => {
  try {
    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ error: '记忆不存在' });
    }
    
    res.json({
      ...memory,
      tags: JSON.parse(memory.tags || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/memories - 创建记忆
app.post('/api/memories', (req, res) => {
  try {
    const { type, name, summary, content, importance, tags, source_file } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({ error: 'type 和 name 是必填字段' });
    }
    
    const id = `mem_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO memories (id, type, name, summary, content, importance, tags, source_file, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, name, summary || '', content || '', importance || 5, JSON.stringify(tags || []), source_file || '', now, now);
    
    res.json({ id, message: '记忆创建成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/memories/:id - 删除记忆
app.delete('/api/memories/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '记忆不存在' });
    }
    
    res.json({ message: '记忆已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Dream API ==========

// GET /api/dreams - Dream 历史
app.get('/api/dreams', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const dreams = db.prepare(`
      SELECT * FROM dreams ORDER BY date DESC LIMIT ?
    `).all(limit);
    
    res.json({ dreams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dreams/trigger - 触发 Dream
app.post('/api/dreams/trigger', (req, res) => {
  try {
    const id = `dream_${uuidv4().slice(0, 8)}`;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    // 创建 Dream 记录
    db.prepare(`
      INSERT INTO dreams (id, date, status, created_at)
      VALUES (?, ?, 'running', ?)
    `).run(id, date, now.toISOString());
    
    // 模拟 Dream 执行
    setTimeout(() => {
      // 计算健康度
      const memories = db.prepare('SELECT COUNT(*) as count FROM memories').get();
      const healthScore = Math.min(100, 60 + Math.floor(memories.count * 0.5));
      
      // 更新 Dream
      db.prepare(`
        UPDATE dreams SET 
          status = 'completed',
          health_score = ?,
          scanned_files = ?,
          new_entries = ?,
          updated_entries = ?
        WHERE id = ?
      `).run(healthScore, 15, 2, 3, id);
      
      // 更新健康度
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT OR REPLACE INTO health_metrics (date, score, freshness, coverage, coherence, efficiency, accessibility)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(today, healthScore, 0.75, 0.80, 0.72, 0.85, 0.78);
      
      console.log(`✅ Dream ${id} 完成`);
    }, 2000);
    
    res.json({ 
      id, 
      status: 'triggered',
      message: 'Dream 已触发，请稍后查看结果' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 统计 API ==========

// GET /api/stats - 全局统计
app.get('/api/stats', (req, res) => {
  try {
    const memories = db.prepare('SELECT COUNT(*) as count FROM memories').get();
    const dreams = db.prepare('SELECT COUNT(*) as count FROM dreams').get();
    const latestHealth = db.prepare('SELECT AVG(score) as avg FROM health_metrics').get();
    const connections = db.prepare('SELECT COUNT(*) as count FROM memories').get();
    
    res.json({
      memories: memories.count,
      dreams: dreams.count,
      avgHealth: Math.round(latestHealth.avg || 0),
      connections: connections.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 启动 ==========

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   xiaoxi-dreams API Server                       ║
║   🧠 认知记忆系统 API                            ║
╠══════════════════════════════════════════════════════╣
║   Local:   http://localhost:${PORT}                  ║
║   Health:  http://localhost:${PORT}/api/health      ║
║   Stats:   http://localhost:${PORT}/api/stats       ║
╚══════════════════════════════════════════════════════╝
  `);
});
