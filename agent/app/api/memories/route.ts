import { NextRequest, NextResponse } from 'next/server'
import { memoryDb } from '@/lib/db'
import type { MemoryType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || undefined

    const result = await memoryDb.getAll({ type, limit, offset, search })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Memories GET error:', error)
    return NextResponse.json({ error: 'Failed to get memories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    const validTypes: MemoryType[] = ['lesson', 'decision', 'fact', 'procedure', 'person', 'project']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`
    const memory = await memoryDb.create({
      id,
      type: body.type,
      name: body.name,
      summary: body.summary || body.name,
      content: body.content || '',
      importance: Math.min(10, Math.max(1, body.importance || 5)),
      tags: body.tags || [body.type],
      source: body.source || 'manual',
    })

    return NextResponse.json({ id: memory.id, message: 'Memory created', memory }, { status: 201 })
  } catch (error) {
    console.error('Memories POST error:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}
