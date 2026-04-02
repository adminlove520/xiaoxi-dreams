import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const agentId = searchParams.get('agentId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
    }
    
    const db = getDb();
    
    // Build query
    let sql = `
      SELECT 
        m.*,
        a.name as agent_name,
        a.species as agent_species
      FROM memory_index m
      JOIN agents a ON m.agent_id = a.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (query) {
      sql += ` AND (m.tags LIKE ? OR m.digest LIKE ? OR m.content_preview LIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }
    
    if (agentId) {
      sql += ` AND m.agent_id = ?`;
      params.push(agentId);
    }
    
    if (type) {
      sql += ` AND m.type = ?`;
      params.push(type);
    }
    
    sql += ` ORDER BY m.importance DESC, m.created_at DESC LIMIT ?`;
    params.push(limit);
    
    const results = db.prepare(sql).all(...params);
    
    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM memory_index m WHERE 1=1`;
    const countParams: any[] = [];
    
    if (query) {
      countSql += ` AND (m.tags LIKE ? OR m.digest LIKE ? OR m.content_preview LIKE ?)`;
      const q = `%${query}%`;
      countParams.push(q, q, q);
    }
    
    if (agentId) {
      countSql += ` AND m.agent_id = ?`;
      countParams.push(agentId);
    }
    
    if (type) {
      countSql += ` AND m.type = ?`;
      countParams.push(type);
    }
    
    const { total } = db.prepare(countSql).get(...countParams) as { total: number };
    
    return NextResponse.json({
      results,
      total,
      query
    });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
