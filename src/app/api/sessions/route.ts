import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken, generateInviteToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, date, time, evaluationInfo, participants } = body

    // Create session
    const sessionData: any = {
      title,
      evaluationInfo: evaluationInfo || null,
    }
    
    if (date) {
      sessionData.date = new Date(date)
    }
    
    if (time) {
      sessionData.time = time
    }
    
    const session = await prisma.session.create({
      data: sessionData,
    })

    // Create participants and generate invite tokens
    const participantData = []
    const inviteLinks = []

    for (const participant of participants) {
      const inviteToken = generateInviteToken()
      const voteToken = generateToken({
        sessionId: session.id,
        type: 'vote'
      })

      const createdParticipant = await prisma.participant.create({
        data: {
          sessionId: session.id,
          displayName: participant.name,
          invitedEmail: participant.email || null,
          inviteToken,
        },
      })

      participantData.push(createdParticipant)
      inviteLinks.push({
        name: participant.name,
        email: participant.email,
        link: `${process.env.APP_URL || 'http://localhost:3000'}/vote/${inviteToken}`,
        token: inviteToken
      })
    }

    // Generate organizer token
    const organizerToken = generateToken({
      sessionId: session.id,
      type: 'organizer'
    })

    return NextResponse.json({
      session,
      participants: participantData,
      inviteLinks,
      organizerLink: `${process.env.APP_URL || 'http://localhost:3000'}/organizer/${organizerToken}`
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        participants: true,
        _count: {
          select: {
            participants: true,
            ballots: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
