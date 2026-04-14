import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { votes } = body
    const tokenHash = hashToken(token)

    console.log('Looking for participant with token:', token)
    
    const participant = await prisma.participant.findUnique({
      where: { inviteToken: token },
      include: { 
        session: {
          include: {
            participants: true,
            fixedShares: true
          }
        }
      }
    })

    console.log('Found participant:', participant ? 'Yes' : 'No')

    if (!participant) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (participant.session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 })
    }

    // Prevent main voting while fixed share pre-vote is still open
    const sessionFixedShares = (participant.session as any).fixedShares || []
    const fixedShareVotingStatus = (participant.session as any).fixedShareVotingStatus
    if (sessionFixedShares.length > 0 && fixedShareVotingStatus === 'OPEN') {
      return NextResponse.json({ error: 'Die Abstimmung über den festen Anteil läuft noch.' }, { status: 400 })
    }

    // Calculate available percentage based on fixed shares mode
    const fixedShares = sessionFixedShares
    const fixedShareMode = (participant.session as any).fixedShareMode
    const totalFixedPercent = fixedShares.reduce((sum: number, fs: any) => sum + fs.percent, 0)
    const availablePercent = fixedShareMode === 'TRANSPARENT_REDUCED' ? (100 - totalFixedPercent) : 100

    // Validate total before processing
    const totalPercentage = votes.reduce((sum: number, vote: any) => sum + vote.percent, 0)
    if (Math.abs(totalPercentage - availablePercent) > 0.01) {
      return NextResponse.json({ 
        error: `Die Gesamtsumme muss genau ${availablePercent.toFixed(0)}% betragen. Aktuell: ${totalPercentage.toFixed(1)}%` 
      }, { status: 400 })
    }

    // Update votes and submit ballot in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert ballot with new votes
      const ballot = await tx.ballot.upsert({
        where: { tokenHash },
        update: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          votes: {
            deleteMany: {},
            create: votes.map((vote: any) => ({
              personId: vote.personId,
              percent: vote.percent
            }))
          }
        },
        create: {
          sessionId: participant.sessionId,
          participantId: participant.id,
          tokenHash,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          votes: {
            create: votes.map((vote: any) => ({
              personId: vote.personId,
              percent: vote.percent
            }))
          }
        },
        include: {
          votes: true
        }
      })

      // Update participant status and link to logged-in user if available
      const authSession = await getServerSession(authOptions)
      const updateData: any = { hasSubmitted: true }
      
      if (authSession?.user) {
        const userId = (authSession.user as any).id
        if (userId) {
          updateData.userId = userId
        }
      }
      
      await tx.participant.update({
        where: { id: participant.id },
        data: updateData
      })

      return ballot
    })

    // Check if all participants have submitted
    const submittedCount = await prisma.participant.count({
      where: {
        sessionId: participant.session.id,
        hasSubmitted: true
      }
    })

    let sessionClosed = false
    if (submittedCount === participant.session.participants.length) {
      // Auto-close session when all participants have voted
      await prisma.votingSession.update({
        where: { id: participant.session.id },
        data: { status: 'CLOSED' }
      })
      sessionClosed = true
    }

    return NextResponse.json({ 
      success: true, 
      ballot: result,
      sessionClosed,
      submittedCount,
      totalParticipants: participant.session.participants.length
    })
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
