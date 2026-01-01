import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Get user ID for hidden sessions check
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Get hidden session IDs for this user
    const hiddenSessions = user ? await prisma.hiddenSession.findMany({
      where: { userId: user.id },
      select: { sessionId: true }
    }) : []
    const hiddenSessionIds = hiddenSessions.map(h => h.sessionId)

    // Find all participants where the invited email matches the logged-in user's email
    // Exclude hidden sessions
    const participants = await prisma.participant.findMany({
      where: {
        invitedEmail: {
          equals: session.user.email,
          mode: 'insensitive'
        },
        sessionId: {
          notIn: hiddenSessionIds
        }
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            status: true,
            creator: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        session: {
          createdAt: 'desc'
        }
      }
    })

    // Transform to invitation format
    const invitations = participants.map(p => ({
      id: p.id,
      sessionId: p.session.id,
      sessionTitle: p.session.title,
      sessionDate: p.session.date,
      sessionTime: p.session.time,
      sessionStatus: p.session.status,
      creatorName: p.session.creator?.name || p.session.creator?.email || 'Unbekannt',
      participantName: p.displayName,
      inviteToken: p.inviteToken,
      hasSubmitted: p.hasSubmitted
    }))

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einladungen' }, { status: 500 })
  }
}
