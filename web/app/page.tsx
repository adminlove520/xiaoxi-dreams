'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, Moon, Cloud, BookOpen, TrendingUp, 
  Activity, Clock, Link2, Sparkles, Settings, Bell,
  AlertCircle, RefreshCw, ArrowUp, ArrowDown, Minus
} from 'lucide-react'

// ========== Types ==========
interface Health {
  score: number
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  dimensions: { freshness: number; coverage: number; coherence: number; efficiency: number; accessibility: number }
  trend: 'up' | 'down' | 'stable'
  date: string | null
}

interface Memory {
  id: string
  type: 'lesson' | 'decision' | 'fact' | 'procedure' | 'person' | 'project'
  name: string
  summary: string
  importance: number
  tags: string[]
}

interface Dream {
  id: string
  date: string
  status: 'running' | 'completed' | 'failed'
  health_score: number
  scanned_files: number
  new_entries: number
  updated_entries: number
}

interface Stats {
  memories: number
  dreams: number
  avgHealth: number
  connections: number
}

// ========== API Base ==========
const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18792')
  : 'http://localhost:18792'

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ========== Components ==========

function LoadingSpinner({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin" />
      <span className="text-zinc-400">{text}</span>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <AlertCircle className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">
          重试
        </button>
      )}
    </div>
  )
}

// Health Ring Component
function HealthRing({ health }: { health: Health }) {
  const circumference = 2 * Math.PI * 80
  const offset = circumference - (health.score / 100) * circumference
  
  const statusColor = {
    healthy: '#22c55e',
    warning: '#eab308',
    critical: '#ef4444',
    unknown: '#71717a',
  }[health.status] || '#71717a'
  
  const statusText = {
    healthy: '健康',
    warning: '注意',
    critical: '告警',
    unknown: '未知',
  }[health.status] || '未知'
  
  const dimensionLabels: Record<string, string> = {
    freshness: '新鲜度',
    coverage: '覆盖度',
    coherence: '连贯度',
    efficiency: '效率',
    accessibility: '可达性',
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
      <h2 className="text-lg font-semibold text-zinc-100 mb-6">健康度</h2>
      
      {/* Ring */}
      <div className="relative inline-block mb-6">
        <svg className="w-48 h-48 -rotate-90">
          <circle cx="96" cy="96" r="80" fill="none" stroke="#27272a" strokeWidth="12" />
          <motion.circle
            cx="96" cy="96" r="80" fill="none"
            stroke={statusColor} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: statusColor }}>{health.score}</span>
          <span className="text-zinc-500 text-sm">/ 100</span>
        </div>
      </div>
      
      {/* Status Badge */}
      <div 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: statusColor }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusColor }} />
        </span>
        {statusText}
      </div>
      
      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        {Object.entries(health.dimensions || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between px-3 py-2 bg-zinc-800 rounded-lg text-sm">
            <span className="text-zinc-400">{dimensionLabels[key] || key}</span>
            <span className="text-green-500 font-mono">{((value as number) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats Grid
function StatsGrid({ stats }: { stats: Stats }) {
  const items = [
    { label: '记忆总数', value: stats.memories, icon: BookOpen, color: '#22c55e' },
    { label: 'Dream 次数', value: stats.dreams, icon: Cloud, color: '#3b82f6' },
    { label: '平均健康度', value: `${stats.avgHealth}%`, icon: TrendingUp, color: '#eab308' },
    { label: '关联数', value: stats.connections, icon: Link2, color: '#f97316' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center hover:border-zinc-700 transition-colors"
        >
          <item.icon className="w-8 h-8 mx-auto mb-2" style={{ color: item.color }} />
          <div className="text-2xl font-bold font-mono mb-1" style={{ color: item.color }}>{item.value}</div>
          <div className="text-sm text-zinc-500">{item.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Recent Memories
function RecentMemories({ memories }: { memories: Memory[] }) {
  const typeColors: Record<string, string> = {
    lesson: '#eab308',
    decision: '#22c55e',
    fact: '#3b82f6',
    project: '#8b5cf6',
    procedure: '#06b6d4',
    person: '#f97316',
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">最近记忆</h2>
      {memories.length === 0 ? (
        <p className="text-zinc-500 text-center py-4">暂无记忆</p>
      ) : (
        <div className="space-y-3">
          {memories.map((mem) => (
            <div key={mem.id} className="flex gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
              <div 
                className="w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: typeColors[mem.type] || '#71717a' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-zinc-400">{mem.type}</span>
                  {mem.importance >= 8 && (
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">重要</span>
                  )}
                </div>
                <p className="text-sm text-zinc-100 font-medium truncate">{mem.name}</p>
                <p className="text-xs text-zinc-500 truncate mt-1">{mem.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Recent Dreams
function RecentDreams({ dreams }: { dreams: Dream[] }) {
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-zinc-500" />
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">最近 Dreams</h2>
      {dreams.length === 0 ? (
        <p className="text-zinc-500 text-center py-4">暂无 Dream</p>
      ) : (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <div key={dream.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{dream.date}</p>
                  <p className="text-xs text-zinc-500">+{dream.new_entries} 记忆</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-zinc-100">{dream.health_score}</p>
                <div className="flex items-center gap-1 text-sm justify-end">
                  <TrendIcon trend="up" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== Main Page ==========
export default function Home() {
  const [health, setHealth] = useState<Health | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [dreams, setDreams] = useState<Dream[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dreaming, setDreaming] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [h, m, d, s] = await Promise.all([
        fetchApi<Health>('/api/health'),
        fetchApi<{ memories: Memory[] }>('/api/memories?limit=5').then(r => r.memories),
        fetchApi<{ dreams: Dream[] }>('/api/dreams?limit=5').then(r => r.dreams),
        fetchApi<Stats>('/api/stats'),
      ])
      setHealth(h)
      setMemories(m)
      setDreams(d)
      setStats(s)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function triggerDream() {
    setDreaming(true)
    try {
      await fetch(`${API_BASE}/api/dreams/trigger`, { method: 'POST' })
      await new Promise(r => setTimeout(r, 2500))
      await loadData()
    } catch (e) {
      console.error('Dream failed:', e)
    } finally {
      setDreaming(false)
    }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-zinc-100">xiaoxi-dreams</h1>
              <p className="text-xs text-zinc-500">认知记忆系统</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-zinc-400" />
            </button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm mb-4">
            <Brain className="w-4 h-4" />
            AI 驱动的记忆系统
          </div>
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">
              让记忆看得见
            </span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            小溪每天在后台「做梦」，整理记忆碎片，追踪成长轨迹。
          </p>
        </motion.div>

        {/* Trigger Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <button
            onClick={triggerDream}
            disabled={dreaming}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Sparkles className={`w-5 h-5 ${dreaming ? 'animate-spin' : ''}`} />
            {dreaming ? '正在做梦...' : '触发 Dream'}
          </button>
        </motion.div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
            {/* Health + Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {health && <HealthRing health={health} />}
              {stats && <StatsGrid stats={stats} />}
            </div>

            {/* Recent */}
            <div className="grid md:grid-cols-2 gap-6">
              <RecentDreams dreams={dreams} />
              <RecentMemories memories={memories} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-zinc-500 text-sm">
        <p>xiaoxi-dreams v3.0 | 小溪认知记忆系统</p>
      </footer>
    </div>
  )
}
