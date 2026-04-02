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

    const headers = { 'Authorization': `ApiKey ${apiKey}`, 'Content-Type': 'application/json' }

    // 同步最近的记忆
    const { memories } = await memoryDb.getAll({ limit: 100 })
    const memoryPayload = memories.map(m => ({
      memory_uuid: m.id,
      digest: m.name,
      type: m.type,
      importance: m.importance,
      tags: m.tags,
      content_preview: m.summary.substring(0, 200),
    }))

    const memRes = await fetch(`${centerUrl}/api/sync/memory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ memories: memoryPayload }),
    })

    // 同步最近的做梦记录
    const dreams = await dreamDb.getAll(10)
    const dreamPayload = dreams.filter(d => d.status === 'completed').map(d => ({
      dream_uuid: d.id,
      summary: d.report?.substring(0, 500) || '',
      health_score: d.health_score,
      memories_created: d.new_entries,
    }))

    const dreamRes = await fetch(`${centerUrl}/api/sync/dream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ dreams: dreamPayload }),
    })

    // 心跳
    await fetch(`${centerUrl}/api/agents/${apiKey.split('_')[1] || 'unknown'}/heartbeat`, {
      method: 'POST',
      headers,
    }).catch(() => {})

    return NextResponse.json({
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
