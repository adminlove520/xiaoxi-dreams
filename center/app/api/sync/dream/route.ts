import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/auth';

const authMiddleware = createAuthMiddleware();

export async function POST(request: Request) {
  try {
    const agent = await authMiddleware(request);
    
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { summary, status, memoriesCreated } = await request.json();
    
    const db = getDb();
    
    // Insert dream index
    const result = db.prepare(`
      INSERT INTO dream_index (agent_id, summary, status, memories_created)
      VALUES (?, ?, ?, ?)
    `).run(agent.id, summary || null, status || 'completed', memoriesCreated || 0);
    
    // Log sync
    db.prepare(`
      INSERT INTO sync_log (agent_id, sync_type, status, details)
      VALUES (?, 'dream', ?, ?)
    `).run(agent.id, status || 'completed', JSON.stringify({ summary: summary?.slice(0, 100), memoriesCreated }));
    
    return NextResponse.json({ success: true, dreamId: result.lastInsertRowid });
  } catch (error) {
    console.error('POST /api/sync/dream error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
