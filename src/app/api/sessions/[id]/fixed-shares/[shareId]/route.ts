import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// PATCH - Update a fixed share
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { id: sessionId, shareId } = await params
    const authSession = await getServerSession()

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { name, percent } = body

    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: { fixedShares: true }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    if (votingSession.creatorId !== user.id) {
      return NextResponse.json({ error: 'Nur der Organisator kann feste Variablen bearbeiten' }, { status: 403 })
    }

    const existingShare = votingSession.fixedShares.find(fs => fs.id === shareId)
    if (!existingShare) {
      return NextResponse.json({ error: 'Feste Variable nicht gefunden' }, { status: 404 })
    }

    // Validate percent if provided
    if (typeof percent === 'number') {
      if (percent <= 0 || percent > 100) {
        return NextResponse.json({ error: 'Prozent muss zwischen 0 und 100 liegen' }, { status: 400 })
      }

      // Check total doesn't exceed 100% (excluding current share)
      const otherTotal = votingSession.fixedShares
        .filter(fs => fs.id !== shareId)
        .reduce((sum, fs) => sum + fs.percent, 0)
      
      if (otherTotal + percent > 99) {
        return NextResponse.json({ 
          error: `Gesamtprozent würde ${(otherTotal + percent).toFixed(1)}% überschreiten. Maximal 99% erlaubt.` 
        }, { status: 400 })
      }
    }

    const updated = await prisma.fixedShare.update({
      where: { id: shareId },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof percent === 'number' && { percent })
      }
    })

    return NextResponse.json({
      success: true,
      fixedShare: updated,
      message: 'Feste Variable wurde aktualisiert'
    })

  } catch (error) {
    console.error('Error updating fixed share:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der festen Variable' }, { status: 500 })
  }
}

// DELETE - Remove a fixed share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { id: sessionId, shareId } = await params
    const authSession = await getServerSession()

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
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
      return NextResponse.json({ error: 'Nur der Organisator kann feste Variablen entfernen' }, { status: 403 })
    }

    await prisma.fixedShare.delete({
      where: { id: shareId }
    })

    return NextResponse.json({
      success: true,
      message: 'Feste Variable wurde entfernt'
    })

  } catch (error) {
    console.error('Error deleting fixed share:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen der festen Variable' }, { status: 500 })
  }
}
