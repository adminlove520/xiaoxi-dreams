import { NextRequest, NextResponse } from 'next/server'
import { dreamDb } from '@/lib/db'
import { executeDream } from '@/lib/dream-engine'

// GET: 获取做梦历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const dreams = await dreamDb.getAll(limit)
    return NextResponse.json({ dreams })
  } catch (error) {
    console.error('Dreams GET error:', error)
    return NextResponse.json({ error: 'Failed to get dreams' }, { status: 500 })
  }
}

// POST: 触发做梦（真实做梦，不是模拟）
export async function POST() {
  try {
    const dream = await executeDream()
    return NextResponse.json({
      status: dream.status,
      dream,
    })
  } catch (error) {
    console.error('Dream trigger error:', error)
    return NextResponse.json({ error: 'Dream failed' }, { status: 500 })
  }
}
