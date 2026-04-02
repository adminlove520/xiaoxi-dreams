import { NextRequest, NextResponse } from 'next/server'
import { memoryDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memory = await memoryDb.getById(params.id)
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }
    return NextResponse.json(memory)
  } catch (error) {
    console.error('Memory GET error:', error)
    return NextResponse.json({ error: 'Failed to get memory' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const success = await memoryDb.update(params.id, body)
    if (!success) {
      return NextResponse.json({ error: 'Memory not found or no changes' }, { status: 404 })
    }
    const updated = await memoryDb.getById(params.id)
    return NextResponse.json({ message: 'Memory updated', memory: updated })
  } catch (error) {
    console.error('Memory PUT error:', error)
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await memoryDb.delete(params.id)
    if (!success) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Memory deleted' })
  } catch (error) {
    console.error('Memory DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
