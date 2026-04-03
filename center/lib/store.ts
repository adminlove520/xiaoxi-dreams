/**
 * Unified Data Store for SuperDreams Center
 * 
 * Auto-detects environment:
 * - If KV_REST_API_URL is set → Vercel KV (production/Vercel)
 * - Otherwise → sql.js (local development / Vercel fallback)
 * 
 * All API routes import from this file instead of db.ts directly.
 */

import type { Agent, MemoryIndex, DreamIndex } from './db';

// Re-export types
export type { Agent, MemoryIndex, DreamIndex };

export interface StoreStats {
  total_agents: number;
  online_agents: number;
  total_memories: number;
  total_dreams: number;
  avg_importance: number | null;
}

export interface SyncLogEntry {
  id: number | string;
  agent_id: string;
  agent_name?: string;
  sync_type: string;
  status: string;
  details: string | null;
  created_at: string;
}

export interface AgentSummary extends Agent {
  memory_count: number;
  dream_count: number;
}

export interface AgentDetailData {
  agent: AgentSummary & { avg_importance: number | null };
  recentMemories: MemoryIndex[];
  recentDreams: DreamIndex[];
}

export interface DashboardData {
  stats: StoreStats;
  memoryByType: { type: string; count: number }[];
  recentActivity: SyncLogEntry[];
  agentsSummary: AgentSummary[];
  dreamsByDay: { date: string; count: number }[];
}

export interface SearchResult extends MemoryIndex {
  agent_name: string;
  agent_species: string;
}

// ==================== Environment Detection ====================
function isKV(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

// ==================== KV Store Implementation ====================
let _redis: any = null;
async function getKV(): Promise<any> {
  if (_redis) return _redis;
  const { Redis } = await import('@upstash/redis');
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing Redis/KV environment variables');
  _redis = new Redis({ url, token });
  return _redis;
}

const kvStore = {
  async getDashboard(): Promise<DashboardData> {
    const kv = await getKV();
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    const agents: AgentSummary[] = [];
    let totalMemories = 0, totalDreams = 0, importanceSum = 0, importanceCount = 0;
    const typeMap: Record<string, number> = {};
    const now = Date.now();

    for (const id of agentIds) {
      const agent = (await kv.get(`agent:${id}`)) as Agent | null;
      if (!agent) continue;
      const memIds: number[] = (await kv.get(`memories:agent:${id}`)) || [];
      const dreamIds: number[] = (await kv.get(`dreams:agent:${id}`)) || [];
      const isOnline = agent.last_heartbeat && (now - new Date(agent.last_heartbeat).getTime()) < 120000;

      agents.push({ ...agent, status: isOnline ? 'online' : 'offline', memory_count: memIds.length, dream_count: dreamIds.length });
      totalMemories += memIds.length;
      totalDreams += dreamIds.length;

      for (const mid of memIds) {
        const mem = (await kv.get(`memory:${mid}`)) as MemoryIndex | null;
        if (mem) {
          typeMap[mem.type] = (typeMap[mem.type] || 0) + 1;
          importanceSum += mem.importance;
          importanceCount++;
        }
      }
    }

    const onlineAgents = agents.filter(a => a.status === 'online').length;
    const memoryByType = Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

    const allLogIds: number[] = (await kv.get('synclog:all')) || [];
    const recentLogIds = allLogIds.slice(-10).reverse();
    const recentActivity: SyncLogEntry[] = [];
    for (const lid of recentLogIds) {
      const log = (await kv.get(`synclog:${lid}`)) as SyncLogEntry | null;
      if (log) {
        const agent = agents.find(a => a.id === log.agent_id);
        recentActivity.push({ ...log, agent_name: agent?.name || 'Unknown' });
      }
    }

    const dreamsByDayMap: Record<string, number> = {};
    for (const agent of agents) {
      const dreamIds: number[] = (await kv.get(`dreams:agent:${agent.id}`)) || [];
      for (const did of dreamIds.slice(-50)) {
        const dream = (await kv.get(`dream:${did}`)) as DreamIndex | null;
        if (dream?.dreamed_at) {
          const date = dream.dreamed_at.slice(0, 10);
          dreamsByDayMap[date] = (dreamsByDayMap[date] || 0) + 1;
        }
      }
    }
    const dreamsByDay = Object.entries(dreamsByDayMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

    return {
      stats: {
        total_agents: agents.length,
        online_agents: onlineAgents,
        total_memories: totalMemories,
        total_dreams: totalDreams,
        avg_importance: importanceCount > 0 ? importanceSum / importanceCount : null,
      },
      memoryByType,
      recentActivity,
      agentsSummary: agents.sort((a, b) => (b.last_heartbeat || '').localeCompare(a.last_heartbeat || '')),
      dreamsByDay,
    };
  },

  async getAgents(): Promise<AgentSummary[]> {
    const kv = await getKV();
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    const agents: AgentSummary[] = [];
    for (const id of agentIds) {
      const agent = (await kv.get(`agent:${id}`)) as Agent | null;
      if (!agent) continue;
      const memIds: number[] = (await kv.get(`memories:agent:${id}`)) || [];
      const dreamIds: number[] = (await kv.get(`dreams:agent:${id}`)) || [];
      agents.push({ ...agent, memory_count: memIds.length, dream_count: dreamIds.length });
    }
    return agents;
  },

  async createAgent(id: string, name: string, species: string, apiKey: string): Promise<Agent> {
    const kv = await getKV();
    const now = new Date().toISOString();
    const agent: Agent = { id, name, species, api_key: apiKey, jwt_secret: null, status: 'online', last_heartbeat: now, created_at: now };
    await kv.set(`agent:${id}`, agent);
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    agentIds.push(id);
    await kv.set('agents:index', agentIds);
    return agent;
  },

  async getAgentDetail(id: string): Promise<AgentDetailData | null> {
    const kv = await getKV();
    const agent = (await kv.get(`agent:${id}`)) as Agent | null;
    if (!agent) return null;
    const memIds: number[] = (await kv.get(`memories:agent:${id}`)) || [];
    const dreamIds: number[] = (await kv.get(`dreams:agent:${id}`)) || [];
    const recentMemories: MemoryIndex[] = [];
    for (const mid of memIds.slice(-10).reverse()) {
      const mem = (await kv.get(`memory:${mid}`)) as MemoryIndex | null;
      if (mem) recentMemories.push(mem);
    }
    const recentDreams: DreamIndex[] = [];
    for (const did of dreamIds.slice(-5).reverse()) {
      const dream = (await kv.get(`dream:${did}`)) as DreamIndex | null;
      if (dream) recentDreams.push(dream);
    }
    let importanceSum = 0;
    for (const m of recentMemories) importanceSum += m.importance;
    const avgImportance = recentMemories.length > 0 ? importanceSum / recentMemories.length : null;
    return {
      agent: { ...agent, memory_count: memIds.length, dream_count: dreamIds.length, avg_importance: avgImportance },
      recentMemories,
      recentDreams,
    };
  },

  async deleteAgent(id: string): Promise<void> {
    const kv = await getKV();
    const memIds: number[] = (await kv.get(`memories:agent:${id}`)) || [];
    for (const mid of memIds) await kv.del(`memory:${mid}`);
    await kv.del(`memories:agent:${id}`);
    const dreamIds: number[] = (await kv.get(`dreams:agent:${id}`)) || [];
    for (const did of dreamIds) await kv.del(`dream:${did}`);
    await kv.del(`dreams:agent:${id}`);
    await kv.del(`agent:${id}`);
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    await kv.set('agents:index', agentIds.filter(a => a !== id));
  },

  async heartbeat(id: string): Promise<boolean> {
    const kv = await getKV();
    const agent = (await kv.get(`agent:${id}`)) as Agent | null;
    if (!agent) return false;
    agent.status = 'online';
    agent.last_heartbeat = new Date().toISOString();
    await kv.set(`agent:${id}`, agent);
    return true;
  },

  async verifyApiKey(apiKey: string): Promise<Agent | null> {
    const kv = await getKV();
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    for (const id of agentIds) {
      const agent = (await kv.get(`agent:${id}`)) as Agent | null;
      if (agent && agent.api_key === apiKey) {
        agent.status = 'online';
        agent.last_heartbeat = new Date().toISOString();
        await kv.set(`agent:${id}`, agent);
        return agent;
      }
    }
    return null;
  },

  async syncMemories(agentId: string, memories: any[]): Promise<{ synced: number; skipped: number }> {
    const kv = await getKV();
    let synced = 0, skipped = 0;
    const existingIds: number[] = (await kv.get(`memories:agent:${agentId}`)) || [];
    const existingUuids = new Set<string>();
    for (const mid of existingIds) {
      const m = (await kv.get(`memory:${mid}`)) as MemoryIndex | null;
      if (m) existingUuids.add(m.memory_uuid);
    }
    for (const item of memories) {
      const { digest, type, importance, tags, memoryUuid, contentPreview } = item;
      if (!digest || !type || !memoryUuid) continue;
      if (existingUuids.has(memoryUuid)) { skipped++; continue; }
      const counter: number = ((await kv.get('memories:counter')) || 0) as number;
      const newId = counter + 1;
      await kv.set('memories:counter', newId);
      const mem: MemoryIndex = {
        id: newId, agent_id: agentId, digest, type, importance: importance || 5,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || null),
        memory_uuid: memoryUuid, content_preview: contentPreview || null,
        created_at: new Date().toISOString(),
      };
      await kv.set(`memory:${newId}`, mem);
      existingIds.push(newId);
      synced++;
    }
    await kv.set(`memories:agent:${agentId}`, existingIds);
    if (synced > 0) await kvStore._addSyncLog(agentId, 'memory', JSON.stringify({ count: synced, skipped }));
    return { synced, skipped };
  },

  async syncDreams(agentId: string, dreams: any[]): Promise<{ synced: number }> {
    const kv = await getKV();
    let synced = 0;
    const existingIds: number[] = (await kv.get(`dreams:agent:${agentId}`)) || [];
    for (const item of dreams) {
      const { summary, status, memoriesCreated, dreamUuid, healthScore } = item;
      const counter: number = ((await kv.get('dreams:counter')) || 0) as number;
      const newId = counter + 1;
      await kv.set('dreams:counter', newId);
      const dream: DreamIndex = {
        id: newId, agent_id: agentId, summary: summary || null,
        status: status || 'completed', memories_created: memoriesCreated || 0,
        dream_uuid: dreamUuid || null, health_score: healthScore || null,
        dreamed_at: new Date().toISOString(),
      };
      await kv.set(`dream:${newId}`, dream);
      existingIds.push(newId);
      synced++;
    }
    await kv.set(`dreams:agent:${agentId}`, existingIds);
    if (synced > 0) await kvStore._addSyncLog(agentId, 'dream', JSON.stringify({ count: synced }));
    return { synced };
  },

  async searchMemories(query: string, agentId?: string, type?: string, limit = 20): Promise<{ results: SearchResult[]; total: number }> {
    const kv = await getKV();
    const agentIds: string[] = (await kv.get('agents:index')) || [];
    const results: SearchResult[] = [];
    const q = query.toLowerCase();
    for (const aid of agentIds) {
      if (agentId && aid !== agentId) continue;
      const agent = (await kv.get(`agent:${aid}`)) as Agent | null;
      if (!agent) continue;
      const memIds: number[] = (await kv.get(`memories:agent:${aid}`)) || [];
      for (const mid of memIds) {
        const mem = (await kv.get(`memory:${mid}`)) as MemoryIndex | null;
        if (!mem) continue;
        if (type && mem.type !== type) continue;
        const searchable = `${mem.digest} ${mem.tags || ''} ${mem.content_preview || ''}`.toLowerCase();
        if (searchable.includes(q)) results.push({ ...mem, agent_name: agent.name, agent_species: agent.species });
      }
    }
    results.sort((a, b) => b.importance - a.importance || (b.created_at || '').localeCompare(a.created_at || ''));
    return { results: results.slice(0, limit), total: results.length };
  },

  async _addSyncLog(agentId: string, syncType: string, details: string) {
    const kv = await getKV();
    const counter: number = ((await kv.get('synclog:counter')) || 0) as number;
    const newId = counter + 1;
    await kv.set('synclog:counter', newId);
    const entry: SyncLogEntry = {
      id: newId, agent_id: agentId, sync_type: syncType, status: 'success',
      details, created_at: new Date().toISOString(),
    };
    await kv.set(`synclog:${newId}`, entry);
    const allIds: number[] = (await kv.get('synclog:all')) || [];
    allIds.push(newId);
    if (allIds.length > 200) allIds.splice(0, allIds.length - 200);
    await kv.set('synclog:all', allIds);
  },
};

// ==================== sql.js Store Implementation ====================
const sqliteStore = {
  getDashboard: async (): Promise<DashboardData> => {
    const { getDb, queryOne, queryAll } = await import('./db');
    const db = await getDb();
    const stats = queryOne(db, `
      SELECT 
        (SELECT COUNT(*) FROM agents) as total_agents,
        (SELECT COUNT(*) FROM agents WHERE status = 'online') as online_agents,
        (SELECT COUNT(*) FROM memory_index) as total_memories,
        (SELECT COUNT(*) FROM dream_index) as total_dreams,
        (SELECT AVG(importance) FROM memory_index) as avg_importance
    `);
    const memoryByType = queryAll(db, `SELECT type, COUNT(*) as count FROM memory_index GROUP BY type ORDER BY count DESC`);
    const recentActivity = queryAll(db, `SELECT s.*, a.name as agent_name FROM sync_log s JOIN agents a ON s.agent_id = a.id ORDER BY s.created_at DESC LIMIT 10`);
    const agentsSummary = queryAll(db, `SELECT a.id, a.name, a.species, a.status, a.last_heartbeat, (SELECT COUNT(*) FROM memory_index WHERE agent_id = a.id) as memory_count, (SELECT COUNT(*) FROM dream_index WHERE agent_id = a.id) as dream_count FROM agents a ORDER BY a.last_heartbeat DESC`);
    const dreamsByDay = queryAll(db, `SELECT date(dreamed_at) as date, COUNT(*) as count FROM dream_index WHERE dreamed_at > datetime('now', '-7 days') GROUP BY date(dreamed_at) ORDER BY date ASC`);
    return { stats, memoryByType, recentActivity, agentsSummary, dreamsByDay };
  },

  getAgents: async (): Promise<AgentSummary[]> => {
    const { getDb, queryAll } = await import('./db');
    const db = await getDb();
    return queryAll(db, `SELECT a.*, (SELECT COUNT(*) FROM memory_index WHERE agent_id = a.id) as memory_count, (SELECT COUNT(*) FROM dream_index WHERE agent_id = a.id) as dream_count FROM agents a ORDER BY a.last_heartbeat DESC`) as AgentSummary[];
  },

  createAgent: async (id: string, name: string, species: string, apiKey: string): Promise<Agent> => {
    const { getDb, runSql, queryOne } = await import('./db');
    const db = await getDb();
    runSql(db, `INSERT INTO agents (id, name, species, api_key, status, last_heartbeat) VALUES (?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)`, [id, name, species, apiKey]);
    return queryOne(db, 'SELECT * FROM agents WHERE id = ?', [id]) as Agent;
  },

  getAgentDetail: async (id: string): Promise<AgentDetailData | null> => {
    const { getDb, queryOne, queryAll } = await import('./db');
    const db = await getDb();
    const agent = queryOne(db, `SELECT a.*, (SELECT COUNT(*) FROM memory_index WHERE agent_id = a.id) as memory_count, (SELECT COUNT(*) FROM dream_index WHERE agent_id = a.id) as dream_count, (SELECT AVG(importance) FROM memory_index WHERE agent_id = a.id) as avg_importance FROM agents a WHERE a.id = ?`, [id]);
    if (!agent) return null;
    const recentMemories = queryAll(db, `SELECT * FROM memory_index WHERE agent_id = ? ORDER BY created_at DESC LIMIT 10`, [id]) as MemoryIndex[];
    const recentDreams = queryAll(db, `SELECT * FROM dream_index WHERE agent_id = ? ORDER BY dreamed_at DESC LIMIT 5`, [id]) as DreamIndex[];
    return { agent, recentMemories, recentDreams };
  },

  deleteAgent: async (id: string): Promise<void> => {
    const { getDb, runSql } = await import('./db');
    const db = await getDb();
    runSql(db, 'DELETE FROM memory_index WHERE agent_id = ?', [id]);
    runSql(db, 'DELETE FROM dream_index WHERE agent_id = ?', [id]);
    runSql(db, 'DELETE FROM sync_log WHERE agent_id = ?', [id]);
    runSql(db, 'DELETE FROM agents WHERE id = ?', [id]);
  },

  heartbeat: async (id: string): Promise<boolean> => {
    const { getDb, runSql } = await import('./db');
    const db = await getDb();
    const changes = runSql(db, `UPDATE agents SET status = 'online', last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    runSql(db, `UPDATE agents SET status = 'offline' WHERE last_heartbeat < datetime('now', '-2 minutes')`);
    return changes > 0;
  },

  verifyApiKey: async (apiKey: string): Promise<Agent | null> => {
    const { getDb, queryOne, runSql } = await import('./db');
    const db = await getDb();
    const agent = queryOne(db, 'SELECT * FROM agents WHERE api_key = ?', [apiKey]) as Agent | null;
    if (agent) {
      runSql(db, 'UPDATE agents SET status = "online", last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?', [agent.id]);
    }
    return agent;
  },

  syncMemories: async (agentId: string, memories: any[]): Promise<{ synced: number; skipped: number }> => {
    const { getDb, queryOne, runSql } = await import('./db');
    const db = await getDb();
    let synced = 0, skipped = 0;
    
    db.run('BEGIN');
    try {
      for (const item of memories) {
        const { digest, type, importance, tags, memoryUuid, contentPreview } = item;
        if (!digest || !type || !memoryUuid) continue;
        if (queryOne(db, 'SELECT id FROM memory_index WHERE agent_id = ? AND memory_uuid = ?', [agentId, memoryUuid])) { skipped++; continue; }
        runSql(db, `INSERT INTO memory_index (agent_id, digest, type, importance, tags, memory_uuid, content_preview) VALUES (?, ?, ?, ?, ?, ?, ?)`, [agentId, digest, type, importance || 5, Array.isArray(tags) ? JSON.stringify(tags) : (tags || null), memoryUuid, contentPreview || null]);
        synced++;
      }
      if (synced > 0) runSql(db, `INSERT INTO sync_log (agent_id, sync_type, status, details) VALUES (?, 'memory', 'success', ?)`, [agentId, JSON.stringify({ count: synced, skipped })]);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
    return { synced, skipped };
  },

  syncDreams: async (agentId: string, dreams: any[]): Promise<{ synced: number }> => {
    const { getDb, runSql } = await import('./db');
    const db = await getDb();
    let synced = 0;
    db.run('BEGIN');
    try {
      for (const item of dreams) {
        const { summary, status, memoriesCreated, dreamUuid, healthScore } = item;
        runSql(db, `INSERT INTO dream_index (agent_id, summary, status, memories_created, dream_uuid, health_score) VALUES (?, ?, ?, ?, ?, ?)`, [agentId, summary || null, status || 'completed', memoriesCreated || 0, dreamUuid || null, healthScore || null]);
        synced++;
      }
      if (synced > 0) runSql(db, `INSERT INTO sync_log (agent_id, sync_type, status, details) VALUES (?, 'dream', 'success', ?)`, [agentId, JSON.stringify({ count: synced })]);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
    return { synced };
  },

  searchMemories: async (query: string, agentId?: string, type?: string, limit = 20): Promise<{ results: SearchResult[]; total: number }> => {
    const { getDb, queryAll, queryOne } = await import('./db');
    const db = await getDb();
    let sql = `SELECT m.*, a.name as agent_name, a.species as agent_species FROM memory_index m JOIN agents a ON m.agent_id = a.id WHERE 1=1`;
    const params: any[] = [];
    const q = `%${query}%`;
    sql += ` AND (m.tags LIKE ? OR m.digest LIKE ? OR m.content_preview LIKE ?)`;
    params.push(q, q, q);
    if (agentId) { sql += ` AND m.agent_id = ?`; params.push(agentId); }
    if (type) { sql += ` AND m.type = ?`; params.push(type); }
    sql += ` ORDER BY m.importance DESC, m.created_at DESC LIMIT ?`;
    params.push(limit);
    const results = queryAll(db, sql, params) as SearchResult[];

    let countSql = `SELECT COUNT(*) as total FROM memory_index m WHERE (m.tags LIKE ? OR m.digest LIKE ? OR m.content_preview LIKE ?)`;
    const cParams: any[] = [q, q, q];
    if (agentId) { countSql += ` AND m.agent_id = ?`; cParams.push(agentId); }
    if (type) { countSql += ` AND m.type = ?`; cParams.push(type); }
    const totalRow = queryOne(db, countSql, cParams) as { total: number };
    return { results, total: totalRow.total };
  },
};

// ==================== Exported Store ====================
export const store = isKV() ? kvStore : sqliteStore;
