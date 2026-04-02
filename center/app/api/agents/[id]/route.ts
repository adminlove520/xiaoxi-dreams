import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Agent } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const agent = db.prepare(`
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM memory_index WHERE agent_id = a.id) as memory_count,
        (SELECT COUNT(*) FROM dream_index WHERE agent_id = a.id) as dream_count,
        (SELECT AVG(importance) FROM memory_index WHERE agent_id = a.id) as avg_importance
      FROM agents a
      WHERE a.id = ?
    `).get(params.id) as any;
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    // Get recent memories
    const recentMemories = db.prepare(`
      SELECT * FROM memory_index 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(params.id);
    
    // Get recent dreams
    const recentDreams = db.prepare(`
      SELECT * FROM dream_index 
      WHERE agent_id = ? 
      ORDER BY dreamed_at DESC 
      LIMIT 5
    `).all(params.id);
    
    return NextResponse.json({
      agent,
      recentMemories,
      recentDreams
    });
  } catch (error) {
    console.error('GET /api/agents/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Delete related records first
    db.prepare('DELETE FROM memory_index WHERE agent_id = ?').run(params.id);
    db.prepare('DELETE FROM dream_index WHERE agent_id = ?').run(params.id);
    db.prepare('DELETE FROM sync_log WHERE agent_id = ?').run(params.id);
    db.prepare('DELETE FROM agents WHERE id = ?').run(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/agents/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
