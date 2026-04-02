import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Overall stats
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM agents) as total_agents,
        (SELECT COUNT(*) FROM agents WHERE status = 'online') as online_agents,
        (SELECT COUNT(*) FROM memory_index) as total_memories,
        (SELECT COUNT(*) FROM dream_index) as total_dreams,
        (SELECT AVG(importance) FROM memory_index) as avg_importance
    `).get() as any;
    
    // Memory distribution by type
    const memoryByType = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM memory_index 
      GROUP BY type 
      ORDER BY count DESC
    `).all();
    
    // Recent sync activity
    const recentActivity = db.prepare(`
      SELECT 
        s.*,
        a.name as agent_name
      FROM sync_log s
      JOIN agents a ON s.agent_id = a.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `).all();
    
    // Agents summary
    const agentsSummary = db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.species,
        a.status,
        a.last_heartbeat,
        COUNT(DISTINCT m.id) as memory_count,
        COUNT(DISTINCT d.id) as dream_count
      FROM agents a
      LEFT JOIN memory_index m ON a.id = m.agent_id
      LEFT JOIN dream_index d ON a.id = d.agent_id
      GROUP BY a.id
      ORDER BY a.last_heartbeat DESC
    `).all();
    
    // Dreams by day (last 7 days)
    const dreamsByDay = db.prepare(`
      SELECT 
        date(dreamed_at) as date,
        COUNT(*) as count
      FROM dream_index
      WHERE dreamed_at > datetime('now', '-7 days')
      GROUP BY date(dreamed_at)
      ORDER BY date ASC
    `).all();
    
    return NextResponse.json({
      stats,
      memoryByType,
      recentActivity,
      agentsSummary,
      dreamsByDay
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
