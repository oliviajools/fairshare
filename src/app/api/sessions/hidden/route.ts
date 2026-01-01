import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch all hidden sessions for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Get all hidden sessions with details
    const hiddenSessions = await prisma.hiddenSession.findMany({
      where: { userId: user.id },
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
        hiddenAt: 'desc'
      }
    })

    // Transform to a simpler format
    const sessions = hiddenSessions.map(h => ({
      id: h.session.id,
      title: h.session.title,
      date: h.session.date,
      time: h.session.time,
      status: h.session.status,
      creatorName: h.session.creator?.name || h.session.creator?.email || 'Unbekannt',
      hiddenAt: h.hiddenAt
    }))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching hidden sessions:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
