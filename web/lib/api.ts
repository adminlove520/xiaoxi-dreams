// API 配置
const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18792')
  : 'http://localhost:18792'

// Types
export interface Health {
  score: number
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
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
  created_at: string
}

export interface Dream {
  id: string
  date: string
  status: 'running' | 'completed' | 'failed'
  health_score: number
  scanned_files: number
  new_entries: number
  updated_entries: number
}

export interface Stats {
  memories: number
  dreams: number
  avgHealth: number
  connections: number
}

// API 客户端
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// API 函数
export const api = {
  health: {
    get: () => fetchApi<Health>('/api/health'),
    history: (days = 7) => fetchApi<{ history: Health[] }>(`/api/health/history?days=${days}`),
  },
  memories: {
    list: (params?: { type?: string; limit?: number; offset?: number }) => {
      const search = new URLSearchParams()
      if (params?.type) search.set('type', params.type)
      if (params?.limit) search.set('limit', String(params.limit))
      if (params?.offset) search.set('offset', String(params.offset))
      return fetchApi<{ memories: Memory[]; total: number }>(`/api/memories?${search}`)
    },
    get: (id: string) => fetchApi<Memory>(`/api/memories/${id}`),
    create: (data: Partial<Memory>) => 
      fetchApi<{ id: string }>('/api/memories', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      }),
    delete: (id: string) => fetchApi<{ message: string }>(`/api/memories/${id}`, { method: 'DELETE' }),
  },
  dreams: {
    list: (limit = 10) => fetchApi<{ dreams: Dream[] }>(`/api/dreams?limit=${limit}`),
    trigger: () => fetchApi<{ id: string; status: string; message: string }>('/api/dreams/trigger', { method: 'POST' }),
  },
  stats: {
    get: () => fetchApi<Stats>('/api/stats'),
  },
}
