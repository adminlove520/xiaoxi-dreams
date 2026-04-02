import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const health = await db.health.get()
    
    if (!health) {
      return NextResponse.json({
        score: 0,
        status: 'unknown',
        dimensions: {},
        date: null,
      })
    }
    
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json({ error: 'Failed to get health' }, { status: 500 })
  }
}
