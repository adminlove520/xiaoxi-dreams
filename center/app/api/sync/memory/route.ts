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
    
    const body = await request.json();
    const memories = Array.isArray(body.memories) ? body.memories : [body];
    
    const db = getDb();
    let syncedCount = 0;
    let skippedCount = 0;
    
    const checkStmt = db.prepare('SELECT id FROM memory_index WHERE agent_id = ? AND memory_uuid = ?');
    const insertStmt = db.prepare(`
      INSERT INTO memory_index (agent_id, digest, type, importance, tags, memory_uuid, content_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const logStmt = db.prepare(`
      INSERT INTO sync_log (agent_id, sync_type, status, details)
      VALUES (?, 'memory', 'success', ?)
    `);

    // Use a transaction for better performance
    const transaction = db.transaction((items) => {
      for (const item of items) {
        const { digest, type, importance, tags, memoryUuid, contentPreview } = item;
        
        if (!digest || !type || !memoryUuid) continue;

        const existing = checkStmt.get(agent.id, memoryUuid);
        if (existing) {
          skippedCount++;
          continue;
        }

        insertStmt.run(agent.id, digest, type, importance || 5, 
          Array.isArray(tags) ? JSON.stringify(tags) : (tags || null), 
          memoryUuid, contentPreview || null);
        
        syncedCount++;
      }
    });

    transaction(memories);
    
    if (syncedCount > 0) {
      logStmt.run(agent.id, JSON.stringify({ count: syncedCount, skipped: skippedCount }));
    }
    
    return NextResponse.json({ success: true, synced: syncedCount, skipped: skippedCount });
  } catch (error) {
    console.error('POST /api/sync/memory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
