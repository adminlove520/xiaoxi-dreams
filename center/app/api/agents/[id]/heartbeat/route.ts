import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyApiKey } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.startsWith('ApiKey ') ? authHeader.slice(7) : null;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }
    
    const agent = verifyApiKey(apiKey);
    if (!agent || agent.id !== params.id) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
    }
    
    const db = getDb();
    db.prepare(`
      UPDATE agents 
      SET status = 'online', last_heartbeat = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(params.id);
    
    // Update status of offline agents (no heartbeat in 2 minutes)
    db.prepare(`
      UPDATE agents 
      SET status = 'offline' 
      WHERE last_heartbeat < datetime('now', '-2 minutes')
    `).run();
    
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('POST /api/agents/[id]/heartbeat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
