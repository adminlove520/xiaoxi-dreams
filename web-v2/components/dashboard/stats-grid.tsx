'use client'

import { motion } from 'framer-motion'
import { BookOpen, Cloud, Zap, Link2 } from 'lucide-react'
import { useStats } from '@/lib/hooks'
import { Card } from '../ui/card'

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  delay 
}: { 
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card hover className="text-center py-6 bg-zinc-900 border-zinc-800 group">
        <div 
          className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="text-3xl font-bold font-mono mb-1" style={{ color }}>
          {value}
        </div>
        <div className="text-sm text-zinc-500">{label}</div>
      </Card>
    </motion.div>
  )
}

export function StatsGrid() {
  const { data, isLoading } = useStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 bg-zinc-900 border-zinc-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const statsData = data || { memories: 0, dreams: 0, avgHealth: 0, connections: 0 }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="记忆总数"
        value={statsData.memories}
        icon={BookOpen}
        color="#22c55e"
        delay={0.1}
      />
      <StatCard
        label="Dream 次数"
        value={statsData.dreams}
        icon={Cloud}
        color="#3b82f6"
        delay={0.2}
      />
      <StatCard
        label="平均健康度"
        value={`${statsData.avgHealth}%`}
        icon={Zap}
        color="#eab308"
        delay={0.3}
      />
      <StatCard
        label="关联数"
        value={statsData.connections || 156}
        icon={Link2}
        color="#f97316"
        delay={0.4}
      />
    </div>
  )
}
