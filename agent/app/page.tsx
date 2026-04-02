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
import SyncSettings from '@/components/SyncSettings'
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-zinc-100 tracking-tight">Superdreams</h1>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Cognitive Core v4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-100">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-100">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold mb-6 border border-green-500/20">
            <Brain className="w-3.5 h-3.5" />
            AI 驱动的认知记忆系统
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
              让记忆被看见。
            </span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Superdreams 每天在后台「做梦」，整理记忆碎片，计算认知健康度，追踪你的成长轨迹。
          </p>
        </motion.div>

        {/* Trigger Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <button
            onClick={triggerDream}
            disabled={dreaming}
            className="group px-8 py-3 bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-white/5 transition-all active:scale-95"
          >
            <Sparkles className={`w-5 h-5 ${dreaming ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            {dreaming ? '正在重塑认知...' : '触发核心做梦记录'}
          </button>
        </motion.div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="space-y-6">
            {/* Top Grid: Health, Stats, Sync */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {health && <HealthRing health={health} />}
              </div>
              <div className="lg:col-span-1">
                {stats && <StatsGrid stats={stats} />}
              </div>
              <div className="lg:col-span-1">
                <SyncSettings />
              </div>
            </div>

            {/* Bottom Grid: Recent Activities */}
            <div className="grid md:grid-cols-2 gap-6">
              <RecentDreams dreams={dreams} />
              <RecentMemories memories={memories} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-12 text-center border-t border-zinc-900 mt-12">
        <p className="text-zinc-500 text-xs font-medium tracking-widest uppercase mb-2">Superdreams 4.0</p>
        <p className="text-zinc-600 text-[10px]">🦞 由龙虾驱动的认知计算引擎</p>
      </footer>
    </div>
  )
}
