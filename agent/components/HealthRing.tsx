'use client'

import { motion } from 'framer-motion'
import type { Health } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#eab308',
  critical: '#ef4444',
  unknown: '#71717a',
}

const STATUS_LABELS: Record<string, string> = {
  healthy: '健康',
  warning: '注意',
  critical: '告警',
  unknown: '未知',
}

const DIM_LABELS: Record<string, string> = {
  freshness: '新鲜度',
  coverage: '覆盖度',
  coherence: '连贯度',
  efficiency: '效率',
  accessibility: '可达性',
}

export default function HealthRing({ health }: { health: Health }) {
  const circumference = 2 * Math.PI * 80
  const offset = circumference - (health.score / 100) * circumference
  const color = STATUS_COLORS[health.status] || STATUS_COLORS.unknown

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
      <h2 className="text-lg font-semibold text-zinc-100 mb-6">健康度</h2>

      <div className="relative inline-block mb-6">
        <svg className="w-48 h-48 -rotate-90">
          <circle cx="96" cy="96" r="80" fill="none" stroke="#27272a" strokeWidth="12" />
          <motion.circle
            cx="96" cy="96" r="80" fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color }}>{health.score}</span>
          <span className="text-zinc-500 text-sm">/ 100</span>
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
        {STATUS_LABELS[health.status] || '未知'}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-6">
        {Object.entries(health.dimensions || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between px-3 py-2 bg-zinc-800 rounded-lg text-sm">
            <span className="text-zinc-400">{DIM_LABELS[key] || key}</span>
            <span className="text-green-500 font-mono">{((value as number) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
