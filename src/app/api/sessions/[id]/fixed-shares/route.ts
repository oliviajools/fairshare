import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - List all fixed shares for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: {
        fixedShares: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      fixedShares: votingSession.fixedShares,
      fixedShareMode: votingSession.fixedShareMode,
      totalFixedPercent: votingSession.fixedShares.reduce((sum, fs) => sum + fs.percent, 0)
    })

  } catch (error) {
    console.error('Error fetching fixed shares:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der festen Variablen' }, { status: 500 })
  }
}

// POST - Add a new fixed share
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const authSession = await getServerSession()

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { name, percent } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    if (typeof percent !== 'number' || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: 'Prozent muss zwischen 0 und 100 liegen' }, { status: 400 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Get the session and verify ownership
    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: { fixedShares: true }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    if (votingSession.creatorId !== user.id) {
      return NextResponse.json({ error: 'Nur der Organisator kann feste Variablen hinzufügen' }, { status: 403 })
    }

    // Check total doesn't exceed 100%
    const currentTotal = votingSession.fixedShares.reduce((sum, fs) => sum + fs.percent, 0)
    if (currentTotal + percent > 99) {
      return NextResponse.json({ 
        error: `Gesamtprozent würde ${(currentTotal + percent).toFixed(1)}% überschreiten. Maximal 99% erlaubt.` 
      }, { status: 400 })
    }

    const fixedShare = await prisma.fixedShare.create({
      data: {
        sessionId,
        name: name.trim(),
        percent
      }
    })

    return NextResponse.json({
      success: true,
      fixedShare,
      message: 'Feste Variable wurde hinzugefügt'
    })

  } catch (error) {
    console.error('Error adding fixed share:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der festen Variable' }, { status: 500 })
  }
}

// PATCH - Update fixed share mode for the session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const authSession = await getServerSession()

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { fixedShareMode } = body

    const validModes = ['TRANSPARENT_REDUCED', 'TRANSPARENT_FULL', 'RESULTS_ONLY', 'PAYOUT_ONLY']
    if (fixedShareMode && !validModes.includes(fixedShareMode)) {
      return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    if (votingSession.creatorId !== user.id) {
      return NextResponse.json({ error: 'Nur der Organisator kann den Modus ändern' }, { status: 403 })
    }

    const updated = await prisma.votingSession.update({
      where: { id: sessionId },
      data: { fixedShareMode: fixedShareMode || null }
    })

    return NextResponse.json({
      success: true,
      fixedShareMode: updated.fixedShareMode,
      message: 'Modus wurde aktualisiert'
    })

  } catch (error) {
    console.error('Error updating fixed share mode:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Modus' }, { status: 500 })
  }
}
