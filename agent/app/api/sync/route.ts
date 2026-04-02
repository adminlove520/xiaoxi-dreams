import { NextRequest, NextResponse } from 'next/server'
import { memoryDb, dreamDb } from '@/lib/db'

/**
 * POST /api/sync — 同步本地数据到 Control Center
 *
 * Body: { centerUrl, apiKey }
 */
export async function POST(request: NextRequest) {
  try {
    const { centerUrl, apiKey } = await request.json()

    if (!centerUrl || !apiKey) {
      return NextResponse.json(
        { error: 'centerUrl and apiKey are required' },
        { status: 400 }
      )
    }

    const headers = { 
      'Authorization': `ApiKey ${apiKey}`, 
      'Content-Type': 'application/json' 
    }

    // 同步最近的记忆
    const { memories } = await memoryDb.getAll({ limit: 100 })
    const memoryPayload = memories.map(m => ({
      memoryUuid: m.id,
      digest: m.name,
      type: m.type,
      importance: m.importance,
      tags: m.tags,
      contentPreview: m.summary.substring(0, 200),
    }))

    const memRes = await fetch(`${centerUrl}/api/sync/memory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ memories: memoryPayload }),
    })

    // 同步最近的做梦记录
    const dreams = await dreamDb.getAll(10)
    const dreamPayload = dreams.filter(d => d.status === 'completed').map(d => ({
      dreamUuid: d.id,
      summary: d.report?.substring(0, 500) || '',
      healthScore: d.health_score,
      memoriesCreated: d.new_entries,
      status: d.status,
    }))

    const dreamRes = await fetch(`${centerUrl}/api/sync/dream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ dreams: dreamPayload }),
    })

    // 注意：心跳逻辑在 Center 的 authMiddleware 中已经自动处理
    // 只要有任何有效的 ApiKey 请求，Center 就可以更新该 Agent 的 last_heartbeat
    // 这里的显式心跳调用可以简化或省略，或者在 Agent 有了自己的 ID 后再恢复。

    return NextResponse.json({
      success: true,
      status: 'synced',
      memories: { sent: memoryPayload.length, status: memRes.status },
      dreams: { sent: dreamPayload.length, status: dreamRes.status },
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    )
  }
}
