import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const participant = await prisma.participant.findUnique({
      where: { inviteToken: token },
      include: {
        session: {
          include: {
            participants: true
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (participant.session.status === 'CLOSED') {
      // Return session data even if closed, so frontend can redirect to results
      return NextResponse.json({
        session: participant.session,
        participant,
        ballot: null
      }, { status: 403 })
    }

    // Get existing ballot if any
    const tokenHash = hashToken(token)
    const existingBallot = await prisma.ballot.findUnique({
      where: { tokenHash },
      include: {
        votes: true
      }
    })

    return NextResponse.json({
      session: participant.session,
      participant,
      ballot: existingBallot
    })
  } catch (error) {
    console.error('Error fetching vote data:', error)
    return NextResponse.json({ error: 'Failed to fetch vote data' }, { status: 500 })
  }
}

