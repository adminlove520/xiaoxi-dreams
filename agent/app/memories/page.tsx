'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Filter, ArrowLeft, RefreshCw, 
  AlertCircle, Moon, ExternalLink 
} from 'lucide-react'
import Link from 'next/link'
import type { Memory } from '@/lib/types'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/memories?limit=100${typeFilter !== 'all' ? `&type=${typeFilter}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch memories')
      const data = await res.json()
      setMemories(data.memories)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [typeFilter])

  const filteredMemories = memories.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.summary.toLowerCase().includes(search.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const typeColors: Record<string, string> = {
    lesson: '#eab308',
    decision: '#22c55e',
    fact: '#3b82f6',
    project: '#8b5cf6',
    procedure: '#06b6d4',
    person: '#f97316',
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-lg">Superdreams 记忆库</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索记忆..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="all">所有类型</option>
              <option value="lesson">教训</option>
              <option value="decision">决策</option>
              <option value="fact">事实</option>
              <option value="project">项目</option>
              <option value="procedure">流程</option>
              <option value="person">人物</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
            <p className="text-zinc-500">同步神经元...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            没有找到相关记忆
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMemories.map((mem, i) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: typeColors[mem.type] || '#71717a' }}
                      />
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{mem.type}</span>
                      {mem.importance >= 8 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded border border-red-500/20">HIGH PRIORITY</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">{mem.name}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">{mem.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {mem.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-1 bg-zinc-800 text-zinc-500 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
