import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { generateToken, generateInviteToken } from '@/lib/jwt'
import { authOptions } from '@/lib/auth'

const APP_URL = process.env.NEXTAUTH_URL || 'https://teampayer.de'

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    const body = await request.json()
    const { title, date, time, evaluationInfo, participants, companyId } = body

    // Generate organizer token
    const organizerToken = generateInviteToken()

    // Create session
    const sessionData: any = {
      title,
      evaluationInfo: evaluationInfo || null,
      organizerToken,
      creatorId: authSession?.user ? (authSession.user as any).id : null,
      companyId: companyId || null,
    }
    
    // Handle date - if provided and not empty, parse it, otherwise set to current date
    if (date && date.trim() !== '') {
      sessionData.date = new Date(date)
    } else {
      sessionData.date = new Date()
    }
    
    if (time && time.trim() !== '') {
      sessionData.time = time
    }
    
    const session = await prisma.votingSession.create({
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
        link: `${APP_URL}/vote/${inviteToken}`,
        token: inviteToken
      })
    }

    return NextResponse.json({
      session,
      participants: participantData,
      inviteLinks,
      organizerLink: `${APP_URL}/organizer/${organizerToken}`
    })
  } catch (error: any) {
    console.error('Error creating session:', error?.message || error)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json({ 
      error: 'Failed to create session', 
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    
    if (!authSession?.user) {
      return NextResponse.json([])
    }

    const userId = (authSession.user as any).id
    const userEmail = (authSession.user as any).email

    // Get hidden session IDs for this user
    const hiddenSessions = await prisma.hiddenSession.findMany({
      where: { userId },
      select: { sessionId: true }
    })
    const hiddenSessionIds = hiddenSessions.map(h => h.sessionId)

    // Get session IDs where user is a participant (by email or userId)
    const participantSessions = await prisma.participant.findMany({
      where: {
        OR: [
          { userId: userId },
          { invitedEmail: userEmail }
        ]
      },
      select: { sessionId: true }
    })
    const participantSessionIds = participantSessions.map(p => p.sessionId)

    // Show sessions where user is creator OR participant, excluding hidden ones
    const sessions = await prisma.votingSession.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { id: { in: participantSessionIds } }
        ],
        id: { notIn: hiddenSessionIds }
      },
      include: {
        participants: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
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
