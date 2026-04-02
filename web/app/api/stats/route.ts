import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const stats = await db.stats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
