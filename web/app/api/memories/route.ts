import { NextRequest, NextResponse } from 'next/server'
import { db, Memory } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let memories = await db.memories.getAll()
    
    // 筛选
    if (type) {
      memories = memories.filter(m => m.type === type)
    }
    
    const total = memories.length
    memories = memories.slice(offset, offset + limit)
    
    return NextResponse.json({
      memories,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('Memories API error:', error)
    return NextResponse.json({ error: 'Failed to get memories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, summary, importance, tags } = body
    
    if (!type || !name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 })
    }
    
    const id = `mem_${Date.now().toString(36)}`
    const now = new Date().toISOString()
    
    const memory: Memory = {
      id,
      type,
      name,
      summary: summary || '',
      importance: importance || 5,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    }
    
    await db.memories.add(memory)
    
    return NextResponse.json({ id, message: 'Memory created' })
  } catch (error) {
    console.error('Create memory error:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}
