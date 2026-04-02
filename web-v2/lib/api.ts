// API Types
export interface Health {
  score: number
  status: 'healthy' | 'warning' | 'critical'
  dimensions: {
    freshness: number
    coverage: number
    coherence: number
    efficiency: number
    accessibility: number
  }
  trend: 'up' | 'down' | 'stable'
  date: string | null
}

export interface Memory {
  id: string
  type: 'fact' | 'decision' | 'lesson' | 'procedure' | 'person' | 'project'
  name: string
  summary: string
  importance: number
  tags: string[]
  createdAt: string
  updatedAt: string
  accessCount: number
}

export interface Dream {
  id: string
  date: string
  status: 'running' | 'completed' | 'failed'
  healthScore: number
  scannedFiles: number
  newEntries: number
  updatedEntries: number
  trend?: 'up' | 'down' | 'stable'
  trendLabel?: string
}

export interface Stats {
  memories: number
  dreams: number
  avgHealth: number
  connections?: number
}

// Mock data for demo mode
export const mockHealth: Health = {
  score: 82,
  status: 'healthy',
  dimensions: {
    freshness: 0.75,
    coverage: 0.80,
    coherence: 0.72,
    efficiency: 0.85,
    accessibility: 0.78,
  },
  trend: 'up',
  date: new Date().toISOString(),
}

export const mockMemories: Memory[] = [
  {
    id: 'mem-001',
    type: 'lesson',
    name: 'openclaw config set 比手动编辑更安全',
    summary: '使用 openclaw config set 比手动编辑 openclaw.json 更安全，因为会自动创建 .bak 备份文件。',
    importance: 8,
    tags: ['openclaw', '安全'],
    createdAt: '2026-04-02',
    updatedAt: '2026-04-02',
    accessCount: 5,
  },
  {
    id: 'mem-002',
    type: 'project',
    name: 'xiaoxi-dreams v2.0 发布',
    summary: '小溪的认知记忆系统升级到 v2.0，增加了 React Web UI 和 Generator-Evaluator 架构。',
    importance: 9,
    tags: ['xiaoxi-dreams', '发布'],
    createdAt: '2026-04-02',
    updatedAt: '2026-04-02',
    accessCount: 12,
  },
  {
    id: 'mem-003',
    type: 'decision',
    name: '使用 Vercel 部署 Web UI',
    summary: '决定使用 Vercel 部署 Web UI，替代 S3 云备份，节省成本且更易访问。',
    importance: 7,
    tags: ['vercel', '部署'],
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
    accessCount: 3,
  },
]

export const mockDreams: Dream[] = [
  {
    id: 'dream-001',
    date: '2026-04-02',
    status: 'completed',
    healthScore: 82,
    scannedFiles: 24,
    newEntries: 3,
    updatedEntries: 5,
    trend: 'up',
    trendLabel: '+5',
  },
  {
    id: 'dream-002',
    date: '2026-04-01',
    status: 'completed',
    healthScore: 77,
    scannedFiles: 18,
    newEntries: 2,
    updatedEntries: 3,
    trend: 'down',
    trendLabel: '-3',
  },
  {
    id: 'dream-003',
    date: '2026-03-31',
    status: 'completed',
    healthScore: 80,
    scannedFiles: 21,
    newEntries: 4,
    updatedEntries: 2,
    trend: 'stable',
    trendLabel: '0',
  },
]

export const mockStats: Stats = {
  memories: 42,
  dreams: 28,
  avgHealth: 79,
  connections: 156,
}

// API Client - falls back to mock data if API unavailable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi<T>(endpoint: string, fallback: T): Promise<T> {
  if (!API_BASE) {
    return fallback
  }
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'X-API-Key': process.env.API_KEY || '' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  } catch {
    return fallback
  }
}

// Health API
export const healthApi = {
  get: () => fetchApi<Health>('/api/v1/health', mockHealth),
  getHistory: (days = 7) => fetchApi<{ history: Health[] }>(`/api/v1/health/history?days=${days}`, { history: [] }),
}

// Memories API
export const memoriesApi = {
  list: (params?: { type?: string; limit?: number; offset?: number }) => 
    fetchApi<{ memories: Memory[]; total: number }>(
      `/api/v1/memories?${new URLSearchParams(params as any)}`,
      { memories: mockMemories, total: mockMemories.length }
    ),
  get: (id: string) => 
    fetchApi<Memory>(`/api/v1/memories/${id}`, mockMemories.find(m => m.id === id) || mockMemories[0]),
}

// Dreams API
export const dreamsApi = {
  list: (limit = 10) => 
    fetchApi<{ dreams: Dream[] }>(`/api/v1/dreams?limit=${limit}`, { dreams: mockDreams }),
  trigger: (mode = 'standard') => 
    fetchApi<{ status: string; message: string }>(
      '/api/v1/dreams/trigger',
      { status: 'success', message: 'Dream 已触发' }
    ),
}

// Stats API
export const statsApi = {
  get: () => fetchApi<Stats>('/api/v1/stats', mockStats),
}
