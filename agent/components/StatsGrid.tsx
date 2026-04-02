'use client'

import { motion } from 'framer-motion'
import { BookOpen, Cloud, TrendingUp, Link2 } from 'lucide-react'
import type { Stats } from '@/lib/types'

const ITEMS = [
  { key: 'memories' as const, label: '记忆总数', icon: BookOpen, color: '#22c55e' },
  { key: 'dreams' as const, label: 'Dream 次数', icon: Cloud, color: '#3b82f6' },
  { key: 'avgHealth' as const, label: '平均健康度', icon: TrendingUp, color: '#eab308', suffix: '%' },
  { key: 'connections' as const, label: '标签关联', icon: Link2, color: '#f97316' },
]

export default function StatsGrid({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {ITEMS.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center hover:border-zinc-700 transition-colors"
        >
          <item.icon className="w-8 h-8 mx-auto mb-2" style={{ color: item.color }} />
          <div className="text-2xl font-bold font-mono mb-1" style={{ color: item.color }}>
            {stats[item.key]}{item.suffix || ''}
          </div>
          <div className="text-sm text-zinc-500">{item.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
