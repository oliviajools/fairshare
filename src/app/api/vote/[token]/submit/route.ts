import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const participant = await prisma.participant.findUnique({
      where: { inviteToken: token },
      include: { session: true }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (participant.session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 })
    }

    const tokenHash = hashToken(token)

    // Get the current ballot with votes to validate 100% total
    const currentBallot = await prisma.ballot.findUnique({
      where: { tokenHash },
      include: { votes: true }
    })

    if (!currentBallot) {
      return NextResponse.json({ error: 'No ballot found' }, { status: 404 })
    }

    // Calculate total percentage
    const totalPercentage = currentBallot.votes.reduce((sum, vote) => sum + vote.percent, 0)
    
    // Validate 100% total (allow small floating point differences)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json({ 
        error: `Die Gesamtsumme muss genau 100% betragen. Aktuell: ${totalPercentage.toFixed(1)}%` 
      }, { status: 400 })
    }

    // Update ballot status to SUBMITTED
    const ballot = await prisma.ballot.update({
      where: { tokenHash },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    })

    // Update participant hasSubmitted flag
    await prisma.participant.update({
      where: { id: participant.id },
      data: { hasSubmitted: true }
    })

    return NextResponse.json(ballot)
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
