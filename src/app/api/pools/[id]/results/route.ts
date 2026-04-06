import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type AggregatedResult = {
  key: string
  name: string
  totalPercent: number
  sessionCount: number
  isFixedShare: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    const { id: poolId } = await params

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
      include: {
        sessions: {
          include: {
            session: {
              include: {
                participants: true,
                fixedShares: true,
                ballots: {
                  where: { status: 'SUBMITTED' },
                  include: {
                    participant: true,
                    votes: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: pool.companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const aggregated = new Map<string, AggregatedResult>()

    for (const poolSession of pool.sessions as any[]) {
      const session = poolSession.session
      if (!session) continue

      const weight = typeof poolSession.weight === 'number' && Number.isFinite(poolSession.weight) ? poolSession.weight : 1

      const resultsMap = new Map<
        string,
        { participantId: string; name: string; totalPercent: number; voteCount: number }
      >()

      for (const participant of session.participants) {
        resultsMap.set(participant.id, {
          participantId: participant.id,
          name: participant.displayName,
          totalPercent: 0,
          voteCount: 0,
        })
      }

      for (const ballot of session.ballots) {
        for (const vote of ballot.votes) {
          const r = resultsMap.get(vote.personId)
          if (!r) continue
          r.totalPercent += vote.percent
          r.voteCount += 1
        }
      }

      let results = Array.from(resultsMap.values()).map((r) => ({
        participantId: r.participantId,
        name: r.name,
        averagePercent: r.voteCount > 0 ? r.totalPercent / r.voteCount : 0,
        isFixedShare: false,
      }))

      const fixedShares = (session as any).fixedShares || []
      const fixedShareMode = (session as any).fixedShareMode
      const totalFixedPercent = fixedShares.reduce((sum: number, fs: any) => sum + fs.percent, 0)

      if (fixedShareMode === 'RESULTS_ONLY' || fixedShareMode === 'PAYOUT_ONLY') {
        const scaleFactor = (100 - totalFixedPercent) / 100
        results = results.map((r) => ({
          ...r,
          averagePercent: r.averagePercent * scaleFactor,
        }))
      }

      const fixedShareResults =
        fixedShareMode !== 'PAYOUT_ONLY'
          ? fixedShares.map((fs: any) => ({
              participantId: `fixed:${fs.id}`,
              name: fs.name,
              averagePercent: fs.percent,
              isFixedShare: true,
            }))
          : []

      const allResults = [...results, ...fixedShareResults]

      for (const r of allResults) {
        const key = r.isFixedShare ? `fixed:${r.name}` : `person:${r.name}`
        const existing = aggregated.get(key)
        if (!existing) {
          aggregated.set(key, {
            key,
            name: r.name,
            totalPercent: r.averagePercent * weight,
            sessionCount: 1,
            isFixedShare: r.isFixedShare,
          })
        } else {
          existing.totalPercent += r.averagePercent * weight
          existing.sessionCount += 1
        }
      }
    }

    const results = Array.from(aggregated.values())
      .map((r) => ({
        key: r.key,
        name: r.name,
        totalPercent: r.totalPercent,
        averagePercent: r.totalPercent,
        sessionCount: r.sessionCount,
        isFixedShare: r.isFixedShare,
      }))
      .sort((a, b) => b.totalPercent - a.totalPercent)

    return NextResponse.json({
      pool: { id: pool.id, name: pool.name, status: pool.status },
      results,
      sessionCount: (pool.sessions as any[]).length,
    })
  } catch (error) {
    console.error('Error fetching pool results:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Pool-Ergebnisse' }, { status: 500 })
  }
}
