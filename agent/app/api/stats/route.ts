import { NextResponse } from 'next/server'
import { getStats } from '@/lib/db'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
