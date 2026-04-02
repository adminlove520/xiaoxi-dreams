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
    const dreams = Array.isArray(body.dreams) ? body.dreams : [body];
    
    const db = getDb();
    let syncedCount = 0;
    
    const insertStmt = db.prepare(`
      INSERT INTO dream_index (agent_id, summary, status, memories_created, dream_uuid, health_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const logStmt = db.prepare(`
      INSERT INTO sync_log (agent_id, sync_type, status, details)
      VALUES (?, 'dream', 'success', ?)
    `);

    // Use a transaction
    const transaction = db.transaction((items) => {
      for (const item of items) {
        const { summary, status, memoriesCreated, dreamUuid, healthScore } = item;
        
        insertStmt.run(agent.id, summary || null, status || 'completed', 
          memoriesCreated || 0, dreamUuid || null, healthScore || null);
        
        syncedCount++;
      }
    });

    transaction(dreams);
    
    if (syncedCount > 0) {
      logStmt.run(agent.id, JSON.stringify({ count: syncedCount }));
    }
    
    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error('POST /api/sync/dream error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
