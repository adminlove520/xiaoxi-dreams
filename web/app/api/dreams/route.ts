import { NextRequest, NextResponse } from 'next/server'
import { db, Dream } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const dreams = await db.dreams.getAll()
    return NextResponse.json({ dreams: dreams.slice(0, limit) })
  } catch (error) {
    console.error('Dreams API error:', error)
    return NextResponse.json({ error: 'Failed to get dreams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const mode = body.mode || 'standard'
    
    // 创建 Dream 记录
    const id = `dream_${Date.now().toString(36)}`
    const date = new Date().toISOString().split('T')[0]
    
    const dream: Dream = {
      id,
      date,
      status: 'running',
      healthScore: 0,
      scannedFiles: 0,
      newEntries: 0,
      updatedEntries: 0,
    }
    
    await db.dreams.add(dream)
    
    // 异步执行 Dream (模拟)
    setTimeout(async () => {
      try {
        // 模拟 Dream 执行
        const memories = await db.memories.getAll()
        const healthScore = Math.min(100, 60 + Math.floor(memories.length * 0.5))
        
        // 更新 Dream 状态
        const dreams = await db.dreams.getAll()
        const dreamIndex = dreams.findIndex(d => d.id === id)
        if (dreamIndex >= 0) {
          dreams[dreamIndex] = {
            ...dreams[dreamIndex],
            status: 'completed',
            healthScore,
            scannedFiles: Math.floor(Math.random() * 20) + 10,
            newEntries: Math.floor(Math.random() * 5) + 1,
            updatedEntries: Math.floor(Math.random() * 5) + 1,
            report: `## 梦境报告\n\n### 统计\n- 扫描: ${Math.floor(Math.random() * 20) + 10} 文件\n- 新增: ${Math.floor(Math.random() * 5) + 1} 条记忆\n- 更新: ${Math.floor(Math.random() * 5) + 1} 条记忆\n\n### 健康度: ${healthScore}/100`,
          }
          await db.dreams.set(dreams)
        }
        
        // 更新健康度
        await db.health.set({
          score: healthScore,
          status: healthScore >= 70 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical',
          dimensions: {
            freshness: 0.7 + Math.random() * 0.2,
            coverage: 0.7 + Math.random() * 0.2,
            coherence: 0.7 + Math.random() * 0.2,
            efficiency: 0.7 + Math.random() * 0.2,
            accessibility: 0.7 + Math.random() * 0.2,
          },
          trend: 'up',
          date,
        })
        
        console.log(`✅ Dream ${id} completed`)
      } catch (e) {
        console.error('Dream execution error:', e)
      }
    }, 2000)
    
    return NextResponse.json({
      id,
      status: 'triggered',
      message: 'Dream 已触发，请稍后查看结果',
    })
  } catch (error) {
    console.error('Trigger dream error:', error)
    return NextResponse.json({ error: 'Failed to trigger dream' }, { status: 500 })
  }
}
