import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find session by organizerToken directly
    const session = await prisma.votingSession.findUnique({
      where: { organizerToken: token },
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
