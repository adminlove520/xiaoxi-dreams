import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '../data')

// 确保目录存在
async function ensureDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 读取 JSON 文件
async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return defaultValue
  }
}

// 写入 JSON 文件
async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// 类型定义
export interface Health {
  score: number
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  dimensions: {
    freshness: number
    coverage: number
    coherence: number
    efficiency: number
    accessibility: number
  }
  trend: 'up' | 'down' | 'stable'
  date: string
}

export interface Memory {
  id: string
  type: 'lesson' | 'decision' | 'fact' | 'procedure' | 'person' | 'project'
  name: string
  summary: string
  importance: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Dream {
  id: string
  date: string
  status: 'running' | 'completed' | 'failed'
  healthScore: number
  scannedFiles: number
  newEntries: number
  updatedEntries: number
  report?: string
}

// 数据库操作
export const db = {
  // 健康度
  health: {
    get: () => readJson<Health | null>('health.json', null),
    set: (data: Health) => writeJson('health.json', data),
  },

  // 记忆
  memories: {
    getAll: () => readJson<Memory[]>('memories.json', []),
    set: (data: Memory[]) => writeJson('memories.json', data),
    add: async (memory: Memory) => {
      const memories = await db.memories.getAll()
      memories.unshift(memory)
      await db.memories.set(memories)
    },
    remove: async (id: string) => {
      const memories = await db.memories.getAll()
      const filtered = memories.filter(m => m.id !== id)
      await db.memories.set(filtered)
    },
  },

  // Dreams
  dreams: {
    getAll: () => readJson<Dream[]>('dreams.json', []),
    set: (data: Dream[]) => writeJson('dreams.json', data),
    add: async (dream: Dream) => {
      const dreams = await db.dreams.getAll()
      dreams.unshift(dream)
      await db.dreams.set(dreams)
    },
  },

  // 统计
  stats: async () => {
    const memories = await db.memories.getAll()
    const dreams = await db.dreams.getAll()
    const health = await db.health.get()
    
    return {
      memories: memories.length,
      dreams: dreams.length,
      avgHealth: health?.score || 0,
      connections: memories.length,
    }
  },
}
