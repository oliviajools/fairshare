import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function POST(
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

    const body = await request.json()
    const { sessionIds } = body

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: 'sessionIds ist erforderlich' }, { status: 400 })
    }

    const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
      include: {
        company: true,
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

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const sessions = await (prisma as any).votingSession.findMany({
      where: {
        id: { in: sessionIds },
        companyId: pool.companyId,
      },
      include: {
        participants: true,
        fixedShares: true,
        ballots: {
          where: { status: 'SUBMITTED' },
          include: {
            votes: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Keine Sessions gefunden' }, { status: 404 })
    }

    // Collect all unique participant names
    const participantSet = new Set<string>()
    for (const session of sessions) {
      for (const participant of session.participants) {
        participantSet.add(participant.displayName)
      }
    }
    const participants = Array.from(participantSet).sort()

    // Build data for Excel
    const data: any[][] = [['', ...participants]] // Header row

    for (const session of sessions) {
      const row: any[] = [session.title]

      // Calculate results for this session
      const resultsMap = new Map<string, number>()

      for (const participant of session.participants) {
        resultsMap.set(participant.displayName, 0)
      }

      for (const ballot of session.ballots) {
        for (const vote of ballot.votes) {
          const participant = session.participants.find((p: any) => p.id === vote.personId)
          if (participant) {
            const current = resultsMap.get(participant.displayName) || 0
            resultsMap.set(participant.displayName, current + vote.percent)
          }
        }
      }

      // Calculate averages
      const voteCounts = new Map<string, number>()
      for (const ballot of session.ballots) {
        for (const vote of ballot.votes) {
          const participant = session.participants.find((p: any) => p.id === vote.personId)
          if (participant) {
            const current = voteCounts.get(participant.displayName) || 0
            voteCounts.set(participant.displayName, current + 1)
          }
        }
      }

      const averages = new Map<string, number>()
      for (const [name, total] of resultsMap) {
        const count = voteCounts.get(name) || 0
        averages.set(name, count > 0 ? total / count : 0)
      }

      // Apply fixed share scaling if needed
      const fixedShares = session.fixedShares || []
      const fixedShareMode = session.fixedShareMode
      const totalFixedPercent = fixedShares.reduce((sum: number, fs: any) => sum + fs.percent, 0)

      if (fixedShareMode === 'RESULTS_ONLY' || fixedShareMode === 'PAYOUT_ONLY') {
        const scaleFactor = (100 - totalFixedPercent) / 100
        for (const [name, avg] of averages) {
          averages.set(name, avg * scaleFactor)
        }
      }

      // Fill row with percentages
      for (const participant of participants) {
        row.push(averages.get(participant)?.toFixed(1) || '')
      }

      data.push(row)
    }

    // Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pool Export')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer as Buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pool-export-${pool.name}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting pool:', error)
    return NextResponse.json({ error: 'Fehler beim Exportieren' }, { status: 500 })
  }
}
