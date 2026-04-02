'use client'

import { Cloud, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import Link from 'next/link'
import type { Dream } from '@/lib/types'

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />
  if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-zinc-500" />
}

export default function RecentDreams({ dreams }: { dreams: Dream[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">最近 Dreams</h2>
        <Link href="/dreams" className="text-xs text-zinc-500 hover:text-green-500 transition-colors">
          历史记录
        </Link>
      </div>
      {dreams.length === 0 ? (
        <p className="text-zinc-500 text-center py-4">暂无 Dream</p>
      ) : (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <div key={dream.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Cloud className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{dream.date}</p>
                  <p className="text-xs text-zinc-500">+{dream.new_entries} 记忆</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-zinc-100">{dream.health_score}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
