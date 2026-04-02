'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Moon, Sparkles, Settings, Bell,
  RefreshCw, AlertCircle, Brain
} from 'lucide-react'
import HealthRing from '@/components/HealthRing'
import StatsGrid from '@/components/StatsGrid'
import RecentMemories from '@/components/RecentMemories'
import RecentDreams from '@/components/RecentDreams'
import type { Health, Stats, Memory, Dream } from '@/lib/types'

// ========== API Base ==========
async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint)
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
      const [h, mData, dData, s] = await Promise.all([
        fetchApi<Health>('/api/health'),
        fetchApi<{ memories: Memory[] }>('/api/memories?limit=5'),
        fetchApi<{ dreams: Dream[] }>('/api/dreams?limit=5'),
        fetchApi<Stats>('/api/stats'),
      ])
      setHealth(h)
      setMemories(mData.memories)
      setDreams(dData.dreams)
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
      await fetch('/api/dreams', { method: 'POST' })
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
              <h1 className="font-semibold text-lg text-zinc-100">Superdreams</h1>
              <p className="text-xs text-zinc-500">超梦认知系统</p>
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
            超梦每天在后台「做梦」，整理记忆碎片，追踪成长轨迹。
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
        <p>Superdreams v3.0 | 超梦认知系统</p>
      </footer>
    </div>
  )
}
