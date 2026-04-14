import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { fixedVotes } = body as {
      fixedVotes: { fixedShareId: string; percent: number }[]
    }

    if (!Array.isArray(fixedVotes) || fixedVotes.length === 0) {
      return NextResponse.json({ error: 'Keine Stimmen übermittelt' }, { status: 400 })
    }

    const participant = await prisma.participant.findUnique({
      where: { inviteToken: token },
      include: {
        session: {
          include: {
            participants: true,
            fixedShares: true,
          },
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (participant.session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 })
    }

    const fixedShares = (participant.session as any).fixedShares || []
    const fixedShareVotingStatus = (participant.session as any).fixedShareVotingStatus

    if (fixedShares.length === 0) {
      return NextResponse.json({ error: 'Keine festen Anteile in dieser Session' }, { status: 400 })
    }

    if (fixedShareVotingStatus !== 'OPEN') {
      return NextResponse.json({ error: 'Die Abstimmung über den festen Anteil ist bereits abgeschlossen.' }, { status: 400 })
    }

    const fixedShareIds = new Set(fixedShares.map((fs: any) => fs.id))

    const sanitizedVotes = fixedVotes.map((v) => ({
      fixedShareId: v.fixedShareId,
      percent: typeof v.percent === 'number' ? v.percent : Number(v.percent),
    }))

    for (const v of sanitizedVotes) {
      if (!fixedShareIds.has(v.fixedShareId)) {
        return NextResponse.json({ error: 'Ungültiger fester Anteil' }, { status: 400 })
      }
      if (!Number.isFinite(v.percent) || v.percent < 0 || v.percent > 100) {
        return NextResponse.json({ error: 'Prozent muss zwischen 0 und 100 liegen' }, { status: 400 })
      }
    }

    const total = sanitizedVotes.reduce((sum, v) => sum + v.percent, 0)
    if (total > 99) {
      return NextResponse.json({ error: `Gesamtprozent darf maximal 99% sein. Aktuell: ${total.toFixed(1)}%` }, { status: 400 })
    }

    const tokenHash = hashToken(token)

    const result = await prisma.$transaction(async (tx) => {
      const existingBallot = await tx.ballot.findUnique({
        where: { tokenHash },
        select: { id: true, status: true },
      })

      if (existingBallot?.status === 'SUBMITTED') {
        return { ballot: null as any, sessionClosedFixedVoting: false, alreadySubmitted: true }
      }

      const ballot = await tx.ballot.upsert({
        where: { tokenHash },
        update: {
          fixedShareVotes: {
            deleteMany: {},
            create: sanitizedVotes.map((v) => ({
              fixedShareId: v.fixedShareId,
              percent: v.percent,
            })),
          },
        },
        create: {
          sessionId: participant.sessionId,
          participantId: participant.id,
          tokenHash,
          fixedShareVotes: {
            create: sanitizedVotes.map((v) => ({
              fixedShareId: v.fixedShareId,
              percent: v.percent,
            })),
          },
        },
        include: {
          fixedShareVotes: true,
        },
      })

      await tx.participant.update({
        where: { id: participant.id },
        data: { hasSubmittedFixedShares: true },
      })

      const submittedCount = await tx.participant.count({
        where: {
          sessionId: participant.sessionId,
          hasSubmittedFixedShares: true,
        },
      })

      let sessionClosedFixedVoting = false

      if (submittedCount === (participant.session as any).participants.length) {
        const averages = await tx.fixedShareVote.groupBy({
          by: ['fixedShareId'],
          where: {
            ballot: {
              sessionId: participant.sessionId,
            },
          },
          _avg: {
            percent: true,
          },
        })

        for (const fs of fixedShares as any[]) {
          const avg = averages.find((a) => a.fixedShareId === fs.id)?._avg.percent
          if (typeof avg === 'number' && Number.isFinite(avg)) {
            await tx.fixedShare.update({
              where: { id: fs.id },
              data: { percent: avg },
            })
          }
        }

        await tx.votingSession.update({
          where: { id: participant.sessionId },
          data: { fixedShareVotingStatus: 'CLOSED' },
        })

        sessionClosedFixedVoting = true
      }

      return { ballot, sessionClosedFixedVoting, alreadySubmitted: false }
    })

    if (result.alreadySubmitted) {
      return NextResponse.json({ error: 'Du hast bereits abgestimmt.' }, { status: 400 })
    }

    const updatedSession = await prisma.votingSession.findUnique({
      where: { id: participant.sessionId },
      include: {
        participants: true,
        fixedShares: true,
      },
    })

    return NextResponse.json({
      success: true,
      ballot: result.ballot,
      sessionClosedFixedVoting: result.sessionClosedFixedVoting,
      session: updatedSession,
    })
  } catch (error) {
    console.error('Error submitting fixed share votes:', error)
    return NextResponse.json({ error: 'Failed to submit fixed share votes' }, { status: 500 })
  }
}
