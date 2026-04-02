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
    
    const { digest, type, importance, tags, memoryUuid, contentPreview } = await request.json();
    
    if (!digest || !type || !memoryUuid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const db = getDb();
    
    // Check if already synced (by memoryUuid)
    const existing = db.prepare('SELECT id FROM memory_index WHERE agent_id = ? AND memory_uuid = ?')
      .get(agent.id, memoryUuid);
    
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already synced', duplicated: true });
    }
    
    // Insert new memory index
    db.prepare(`
      INSERT INTO memory_index (agent_id, digest, type, importance, tags, memory_uuid, content_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(agent.id, digest, type, importance || 5, tags || null, memoryUuid, contentPreview || null);
    
    // Log sync
    db.prepare(`
      INSERT INTO sync_log (agent_id, sync_type, status, details)
      VALUES (?, 'memory', 'success', ?)
    `).run(agent.id, JSON.stringify({ memoryUuid, type, importance }));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/sync/memory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
