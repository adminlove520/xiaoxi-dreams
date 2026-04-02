import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '@/lib/auth';
import type { Agent } from '@/lib/db';

function generateApiKey(): string {
  return 'sk_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 24);
}

export async function GET() {
  try {
    const db = getDb();
    const agents = db.prepare(`
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM memory_index WHERE agent_id = a.id) as memory_count,
        (SELECT COUNT(*) FROM dream_index WHERE agent_id = a.id) as dream_count
      FROM agents a
      ORDER BY a.last_heartbeat DESC
    `).all();
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('GET /api/agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, species = 'lobster' } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const db = getDb();
    const id = uuidv4();
    const apiKey = generateApiKey();
    
    db.prepare(`
      INSERT INTO agents (id, name, species, api_key, status, last_heartbeat)
      VALUES (?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
    `).run(id, name, species, apiKey);
    
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent;
    
    // Pass apiKey into generateToken as requested
    const token = generateToken(id, apiKey);
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        species: agent.species,
        status: agent.status,
        created_at: agent.created_at
      },
      apiKey, // Only returned once on creation!
      token
    });
  } catch (error) {
    console.error('POST /api/agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
