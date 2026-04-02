import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memories = await db.memories.getAll()
    const memory = memories.find(m => m.id === id)
    
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }
    
    return NextResponse.json(memory)
  } catch (error) {
    console.error('Get memory error:', error)
    return NextResponse.json({ error: 'Failed to get memory' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.memories.remove(id)
    return NextResponse.json({ message: 'Memory deleted' })
  } catch (error) {
    console.error('Delete memory error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
