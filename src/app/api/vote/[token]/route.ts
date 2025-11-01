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
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { votes } = body

    const participant = await prisma.participant.findUnique({
      where: { inviteToken: token },
      include: { session: true }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (participant.session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 })
    }

    const tokenHash = hashToken(token)

    // Upsert ballot
    const ballot = await prisma.ballot.upsert({
      where: { tokenHash },
      update: {
        votes: {
          deleteMany: {},
          create: votes.map((vote: any) => ({
            personId: vote.personId,
            percent: vote.percent
          }))
        }
      },
      create: {
        sessionId: participant.sessionId,
        participantId: participant.id,
        tokenHash,
        votes: {
          create: votes.map((vote: any) => ({
            personId: vote.personId,
            percent: vote.percent
          }))
        }
      },
      include: {
        votes: true
      }
    })

    return NextResponse.json(ballot)
  } catch (error) {
    console.error('Error saving vote:', error)
    return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
  }
}
