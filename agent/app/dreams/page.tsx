'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, RefreshCw, AlertCircle, 
  Cloud, Calendar, FileText, CheckCircle2,
  XCircle, PlayCircle
} from 'lucide-react'
import Link from 'next/link'
import type { Dream } from '@/lib/types'

export default function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dreams?limit=50')
      if (!res.ok) throw new Error('Failed to fetch dreams')
      const data = await res.json()
      setDreams(data.dreams)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-lg">Superdreams 历史</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
            <p className="text-zinc-500">正在进入梦境...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
          </div>
        ) : dreams.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            还没有任何梦境记录
          </div>
        ) : (
          <div className="relative border-l border-zinc-800 ml-4 pl-8 space-y-12">
            {dreams.map((dream, i) => (
              <motion.div
                key={dream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    dream.status === 'completed' ? 'bg-green-500' : 
                    dream.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
                  }`} />
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-800 rounded-xl">
                          <Calendar className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-zinc-100">{dream.date}</div>
                          <div className="text-xs text-zinc-500 font-mono">ID: {dream.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">健康度</div>
                          <div className="text-xl font-bold text-green-500 font-mono">{dream.health_score}</div>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">新增</div>
                          <div className="text-xl font-bold text-zinc-100 font-mono">{dream.new_entries}</div>
                        </div>
                      </div>
                    </div>

                    {dream.report && (
                      <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                        <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm">
                          <FileText className="w-4 h-4" />
                          <span>报告摘要</span>
                        </div>
                        <div className="text-sm text-zinc-400 line-clamp-3 whitespace-pre-wrap">
                          {dream.report.replace(/#+ /g, '').slice(0, 200)}...
                        </div>
                        <button className="mt-4 text-xs font-medium text-green-500 hover:text-green-400 transition-colors flex items-center gap-1">
                          阅读完整报告
                          <PlayCircle className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-zinc-600" />
                        <span>扫描了 {dream.scanned_files} 个日志</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-zinc-600" />
                        <span>更新了 {dream.updated_entries} 条现有记忆</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
