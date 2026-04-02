'use client'

import { motion } from 'framer-motion'
import { Lightbulb, Target, BookOpen, User, Folder, Wrench } from 'lucide-react'
import { useMemories } from '@/lib/hooks'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

type MemoryType = 'lesson' | 'decision' | 'fact' | 'person' | 'project' | 'procedure'

const typeConfig: Record<MemoryType, { icon: React.ElementType; label: string; color: string }> = {
  lesson: { icon: Lightbulb, label: 'lesson', color: '#eab308' },
  decision: { icon: Target, label: 'decision', color: '#22c55e' },
  fact: { icon: BookOpen, label: 'fact', color: '#3b82f6' },
  person: { icon: User, label: 'person', color: '#f97316' },
  project: { icon: Folder, label: 'project', color: '#8b5cf6' },
  procedure: { icon: Wrench, label: 'procedure', color: '#06b6d4' },
}

function MemoryRow({ memory, index }: { memory: { type: MemoryType }; index: number }) {
  const config = typeConfig[memory.type] || typeConfig.fact

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="group flex items-start gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-4 px-4 transition-colors rounded-lg cursor-pointer">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <config.icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" size="sm">{memory.type}</Badge>
            {memory.importance >= 8 && (
              <Badge variant="danger" size="sm">重要</Badge>
            )}
          </div>
          <div className="font-medium truncate">{memory.name}</div>
          <div className="text-sm text-text-muted line-clamp-2">
            {memory.summary}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-subtle">
            <span>{memory.createdAt}</span>
            {memory.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="px-1.5 py-0.5 bg-bg-elevated rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function RecentMemories() {
  const { data, isLoading } = useMemories({ limit: 5 })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近记忆</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-20 bg-bg-elevated rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const memories = data?.memories || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近记忆</CardTitle>
      </CardHeader>
      <CardContent>
        {memories.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            暂无记忆
          </div>
        ) : (
          <div>
            {memories.map((memory, index) => (
              <MemoryRow key={memory.id} memory={memory} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
