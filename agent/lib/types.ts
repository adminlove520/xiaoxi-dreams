// ============================================================
// Superdreams — 统一类型定义 (Single Source of Truth)
// ============================================================

// ---------- 记忆类型 ----------
export type MemoryType = 'lesson' | 'decision' | 'fact' | 'procedure' | 'person' | 'project'

export interface Memory {
  id: string
  type: MemoryType
  name: string
  summary: string
  content: string
  importance: number
  tags: string[]
  source: string
  created_at: string
  updated_at: string
}

// ---------- 健康度 ----------
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'
export type Trend = 'up' | 'down' | 'stable'

export interface HealthDimensions {
  freshness: number
  coverage: number
  coherence: number
  efficiency: number
  accessibility: number
}

export interface Health {
  id?: number
  date: string
  score: number
  status: HealthStatus
  dimensions: HealthDimensions
  trend: Trend
  created_at?: string
}

// ---------- Dream ----------
export type DreamStatus = 'running' | 'completed' | 'failed'

export interface Dream {
  id: string
  date: string
  status: DreamStatus
  health_score: number
  scanned_files: number
  new_entries: number
  updated_entries: number
  report: string
  started_at: string
  completed_at: string | null
}

// ---------- 统计 ----------
export interface Stats {
  memories: number
  dreams: number
  avgHealth: number
  connections: number
  typeDistribution: Record<string, number>
}

// ---------- 同步配置 ----------
export interface SyncConfig {
  centerUrl: string
  apiKey: string
  agentId: string
}
