'use client'

import Link from 'next/link'
import type { Memory } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  lesson: '#eab308',
  decision: '#22c55e',
  fact: '#3b82f6',
  project: '#8b5cf6',
  procedure: '#06b6d4',
  person: '#f97316',
}

export default function RecentMemories({ memories }: { memories: Memory[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">最近记忆</h2>
        <Link href="/memories" className="text-xs text-zinc-500 hover:text-green-500 transition-colors">
          查看全部
        </Link>
      </div>
      {memories.length === 0 ? (
        <p className="text-zinc-500 text-center py-4">暂无记忆</p>
      ) : (
        <div className="space-y-3">
          {memories.map((mem) => (
            <div key={mem.id} className="flex gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group cursor-pointer">
              <div
                className="w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[mem.type] || '#71717a' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-zinc-400">{mem.type}</span>
                  {mem.importance >= 8 && (
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">重要</span>
                  )}
                </div>
                <p className="text-sm text-zinc-100 font-medium truncate group-hover:text-green-400 transition-colors">{mem.name}</p>
                <p className="text-xs text-zinc-500 truncate mt-1">{mem.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
