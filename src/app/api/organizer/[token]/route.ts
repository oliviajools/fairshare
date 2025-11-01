import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const payload = verifyToken(token)
    
    if (!payload || payload.type !== 'organizer') {
      return NextResponse.json({ error: 'Invalid organizer token' }, { status: 403 })
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        participants: true,
        _count: {
          select: {
            ballots: {
              where: {
                status: 'SUBMITTED'
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching organizer session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
