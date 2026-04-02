import { NextRequest, NextResponse } from 'next/server'
import { healthDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const history = searchParams.get('history')
    const days = parseInt(searchParams.get('days') || '30')

    if (history === 'true') {
      const records = await healthDb.getHistory(days)
      return NextResponse.json({ history: records })
    }

    const health = await healthDb.getLatest()
    if (!health) {
      return NextResponse.json({
        date: null,
        score: 0,
        status: 'unknown',
        dimensions: { freshness: 0, coverage: 0, coherence: 0, efficiency: 0, accessibility: 0 },
        trend: 'stable',
      })
    }
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json({ error: 'Failed to get health' }, { status: 500 })
  }
}
