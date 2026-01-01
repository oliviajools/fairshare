import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Hide session for current user only
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: sessionId } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if session exists
    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    // Check if already hidden
    const existingHidden = await prisma.hiddenSession.findUnique({
      where: {
        userId_sessionId: {
          userId: user.id,
          sessionId
        }
      }
    })

    if (existingHidden) {
      return NextResponse.json({ message: 'Session bereits ausgeblendet' })
    }

    // Hide session for user
    await prisma.hiddenSession.create({
      data: {
        userId: user.id,
        sessionId
      }
    })

    return NextResponse.json({ success: true, message: 'Session ausgeblendet' })
  } catch (error) {
    console.error('Error hiding session:', error)
    return NextResponse.json({ error: 'Fehler beim Ausblenden' }, { status: 500 })
  }
}

// DELETE - Unhide session for current user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: sessionId } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    await prisma.hiddenSession.deleteMany({
      where: {
        userId: user.id,
        sessionId
      }
    })

    return NextResponse.json({ success: true, message: 'Session wieder sichtbar' })
  } catch (error) {
    console.error('Error unhiding session:', error)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
