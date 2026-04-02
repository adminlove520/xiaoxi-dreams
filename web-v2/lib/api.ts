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
}

export interface Stats {
  memories: number
  dreams: number
  avgHealth: number
  connections?: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

// API Client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18792/api/v1'
const API_KEY = process.env.API_KEY || 'xiaoxi-api-key'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}

// Health API
export const healthApi = {
  get: () => fetchApi<Health>('/health'),
  getHistory: (days = 7) => fetchApi<{ history: Health[] }>(`/health/history?days=${days}`),
}

// Memories API
export const memoriesApi = {
  list: (params?: { type?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set('type', params.type)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    return fetchApi<{ memories: Memory[]; total: number }>(`/memories?${searchParams}`)
  },
  get: (id: string) => fetchApi<Memory>(`/memories/${id}`),
}

// Dreams API
export const dreamsApi = {
  list: (limit = 10) => fetchApi<{ dreams: Dream[] }>(`/dreams?limit=${limit}`),
  trigger: (mode = 'standard') => 
    fetchApi<{ status: string; message: string }>('/dreams/trigger', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
}

// Stats API
export const statsApi = {
  get: () => fetchApi<Stats>('/stats'),
}
