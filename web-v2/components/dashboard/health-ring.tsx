'use client'

import { motion } from 'framer-motion'
import { useHealth } from '@/lib/hooks'
import { Card } from '../ui/card'

export function HealthRing() {
  const { data: health, isLoading, error } = useHealth()

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center h-64 bg-zinc-900 border-zinc-800">
        <div className="animate-pulse text-zinc-400">加载中...</div>
      </Card>
    )
  }

  if (error || !health) {
    return (
      <Card className="flex items-center justify-center h-64 bg-zinc-900 border-zinc-800">
        <div className="text-red-500">无法加载健康度</div>
      </Card>
    )
  }

  const score = health.score || 0
  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference - (score / 100) * circumference

  const statusConfig = {
    healthy: { color: '#22c55e', label: '健康', message: '系统运行良好' },
    warning: { color: '#eab308', label: '注意', message: '建议关注' },
    critical: { color: '#ef4444', label: '告警', message: '需要处理' },
  }

  const status = statusConfig[health.status as keyof typeof statusConfig] || statusConfig.warning

  const dimensionLabels: Record<string, string> = {
    freshness: '新鲜度',
    coverage: '覆盖度',
    coherence: '连贯度',
    efficiency: '效率',
    accessibility: '可达性',
  }

  return (
    <Card className="text-center py-8 bg-zinc-900 border-zinc-800">
      <div className="relative inline-flex items-center justify-center mb-6">
        {/* Background ring */}
        <svg className="w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-zinc-800"
          />
          {/* Progress ring */}
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke={status.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-5xl font-bold"
            style={{ color: status.color }}
          >
            {score}
          </motion.div>
          <div className="text-zinc-500 text-sm">/ 100</div>
        </div>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
        style={{ backgroundColor: `${status.color}20`, color: status.color }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: status.color }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: status.color }} />
        </span>
        {status.label}
      </motion.div>

      <p className="text-zinc-500 mt-3 text-sm">{status.message}</p>

      {/* Dimensions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-2 gap-2 mt-6"
      >
        {Object.entries(health.dimensions).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm px-3 py-2 bg-zinc-800 rounded-lg">
            <span className="text-zinc-400">{dimensionLabels[key] || key}</span>
            <span className="font-mono text-green-500">{(value * 100).toFixed(0)}%</span>
          </div>
        ))}
      </motion.div>
    </Card>
  )
}
