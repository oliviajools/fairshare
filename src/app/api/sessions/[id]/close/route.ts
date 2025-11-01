import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = verifyToken(token)

    if (!payload || payload.type !== 'organizer' || payload.sessionId !== id) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 403 })
    }

    const session = await prisma.session.update({
      where: { id },
      data: { status: 'CLOSED' }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error closing session:', error)
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 })
  }
}
