import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

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
    const { name, email } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
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
      include: {
        participants: true
      }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
    }

    // Check if user is the creator (organizer)
    if (votingSession.creatorId !== user.id) {
      return NextResponse.json({ error: 'Nur der Organisator kann Teilnehmer hinzufügen' }, { status: 403 })
    }

    // Check if participant with same name already exists
    const existingParticipant = votingSession.participants.find(
      p => p.displayName.toLowerCase() === name.trim().toLowerCase()
    )
    if (existingParticipant) {
      return NextResponse.json({ error: 'Ein Teilnehmer mit diesem Namen existiert bereits' }, { status: 400 })
    }

    // Create the new participant
    const inviteToken = crypto.randomUUID()
    const newParticipant = await prisma.participant.create({
      data: {
        sessionId: sessionId,
        displayName: name.trim(),
        invitedEmail: email?.trim() || null,
        inviteToken: inviteToken,
        hasSubmitted: false
      }
    })

    // Generate invite link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/vote/${inviteToken}`

    return NextResponse.json({ 
      success: true, 
      participant: {
        id: newParticipant.id,
        displayName: newParticipant.displayName,
        invitedEmail: newParticipant.invitedEmail,
        inviteToken: newParticipant.inviteToken,
        inviteLink: inviteLink,
        hasSubmitted: newParticipant.hasSubmitted
      },
      message: 'Teilnehmer wurde hinzugefügt' 
    })

  } catch (error) {
    console.error('Error adding participant:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen des Teilnehmers' }, { status: 500 })
  }
}
