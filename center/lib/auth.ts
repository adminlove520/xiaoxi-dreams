import jwt from 'jsonwebtoken';
import { getDb } from './db';
import type { Agent } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-dreams-secret-key-change-in-production';

export interface AuthPayload {
  agentId: string;
  apiKey: string;
}

export function generateToken(agentId: string, apiKey: string): string {
  return jwt.sign({ agentId, apiKey }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyApiKey(apiKey: string): Agent | null {
  const db = getDb();
  const agent = db.prepare('SELECT * FROM agents WHERE api_key = ?').get(apiKey) as Agent | undefined;
  if (agent) {
    // Proactive heartbeat: update last_heartbeat on any valid API call
    db.prepare('UPDATE agents SET status = "online", last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?')
      .run(agent.id);
  }
  return agent || null;
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function createAuthMiddleware() {
  return async (req: Request): Promise<Agent | null> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return null;

    // Handle Bearer (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (payload && payload.apiKey) {
        return verifyApiKey(payload.apiKey);
      }
    }

    // Handle ApiKey
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.slice(7);
      return verifyApiKey(apiKey);
    }
    
    return null;
  };
}
