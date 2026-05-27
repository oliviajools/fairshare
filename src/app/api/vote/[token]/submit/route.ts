import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/jwt'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const totalFixedPercent = fixedShares.reduce((sum: number, fs: any) => sum + fs.percent, 0)

    // Participants always distribute 100%, which gets scaled to the remaining percentage
    const availablePercent = 100

    // Validate total before processing (always 100%)
    const totalPercentage = votes.reduce((sum: number, vote: any) => sum + vote.percent, 0)
    if (Math.abs(totalPercentage - availablePercent) > 0.01) {
      return NextResponse.json({
        error: `Die Gesamtsumme muss genau ${availablePercent.toFixed(0)}% betragen. Aktuell: ${totalPercentage.toFixed(1)}%`
      }, { status: 400 })
    }

    // Scale votes to the remaining percentage before saving
    const scaleFactor = totalFixedPercent > 0 ? (100 - totalFixedPercent) / 100 : 1
    const scaledVotes = votes.map((vote: any) => ({
      ...vote,
      percent: vote.percent * scaleFactor
    }))

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
            create: scaledVotes.map((vote: any) => ({
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
            create: scaledVotes.map((vote: any) => ({
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

      // Check if this session is linked to a classroom group and send email to teacher
      const group = await prisma.classroomGroup.findFirst({
        where: { sessionId: participant.session.id },
        include: {
          classroom: {
            include: {
              teacher: true
            }
          },
          project: true
        }
      })

      if (group && group.classroom.teacher.email) {
        try {
          await resend.emails.send({
            from: 'noreply@teampayer.de',
            to: group.classroom.teacher.email,
            subject: `Gruppe ${group.name} hat abgestimmt`,
            html: `
              <h1>Gruppe vollständig abgestimmt</h1>
              <p>Die Gruppe <strong>${group.name}</strong> hat vollständig abgestimmt.</p>
              ${group.project ? `<p><strong>Projekt:</strong> ${group.project.name}</p>` : ''}
              <p>Du kannst jetzt die Noten berechnen und eintragen.</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'https://teampayer.de'}/classroom/${group.classroom.id}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zur Klasse</a></p>
            `
          })
        } catch (emailError) {
          console.error('Failed to send email to teacher', emailError)
        }
      }
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
