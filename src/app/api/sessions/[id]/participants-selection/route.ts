import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { participantIds } = body

    if (!Array.isArray(participantIds)) {
      return NextResponse.json({ error: 'participantIds muss ein Array sein' }, { status: 400 })
    }

    // Update all participants to set includedInMainVoting
    await prisma.participant.updateMany({
      where: { sessionId: id },
      data: { includedInMainVoting: false }
    })

    // Set includedInMainVoting to true for selected participants
    if (participantIds.length > 0) {
      await prisma.participant.updateMany({
        where: {
          sessionId: id,
          id: { in: participantIds }
        },
        data: { includedInMainVoting: true }
      })
    }

    // Mark participant selection as complete
    await prisma.votingSession.update({
      where: { id },
      data: { participantSelectionComplete: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating participant selection:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Auswahl' }, { status: 500 })
  }
}
