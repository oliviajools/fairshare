import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find session and verify organizer token
    const session = await prisma.votingSession.findUnique({
      where: { id }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.organizerToken !== token) {
      return NextResponse.json({ error: 'Invalid organizer token' }, { status: 403 })
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is already closed' }, { status: 400 })
    }

    // Close the session
    const updatedSession = await prisma.votingSession.update({
      where: { id },
      data: { status: 'CLOSED' }
    })

    return NextResponse.json({
      id: updatedSession.id,
      status: updatedSession.status,
      message: 'Session closed successfully'
    })
  } catch (error) {
    console.error('Error closing session:', error)
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 })
  }
}
