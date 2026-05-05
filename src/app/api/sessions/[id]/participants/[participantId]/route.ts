import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id: sessionId, participantId } = await params
    const authSession = await getServerSession()

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
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
      return NextResponse.json({ error: 'Nur der Organisator kann Teilnehmer entfernen' }, { status: 403 })
    }

    // Allow removal if:
    // 1. Session is OPEN (normal voting phase)
    // 2. OR Session has fixed shares and fixed share voting is CLOSED but session is still OPEN
    const fixedShareVotingStatus = (votingSession as any).fixedShareVotingStatus
    const hasFixedShares = (votingSession as any).fixedShares && (votingSession as any).fixedShares.length > 0

    const canRemove =
      votingSession.status === 'OPEN' &&
      (!hasFixedShares || fixedShareVotingStatus === 'CLOSED')

    if (!canRemove) {
      if (votingSession.status === 'CLOSED') {
        return NextResponse.json({ error: 'Teilnehmer können nicht aus geschlossenen Sessions entfernt werden' }, { status: 403 })
      }
      if (hasFixedShares && fixedShareVotingStatus === 'OPEN') {
        return NextResponse.json({ error: 'Teilnehmer können erst nach der Abstimmung über die festen Anteile entfernt werden' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Teilnehmer können in diesem Status nicht entfernt werden' }, { status: 403 })
    }

    // Check if participant exists in this session
    const participant = votingSession.participants.find(p => p.id === participantId)
    if (!participant) {
      return NextResponse.json({ error: 'Teilnehmer nicht gefunden' }, { status: 404 })
    }

    // Delete all votes FOR this participant (votes where personId = participantId)
    await prisma.vote.deleteMany({
      where: {
        personId: participantId
      }
    })

    // Delete all ballots BY this participant (and their votes will cascade)
    await prisma.ballot.deleteMany({
      where: {
        participantId: participantId
      }
    })

    // Delete the participant
    await prisma.participant.delete({
      where: { id: participantId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Teilnehmer und alle zugehörigen Stimmen wurden entfernt' 
    })

  } catch (error) {
    console.error('Error removing participant:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen des Teilnehmers' }, { status: 500 })
  }
}
