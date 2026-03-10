import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await prisma.votingSession.findUnique({
      where: { id },
      include: {
        participants: true,
        fixedShares: true,
        ballots: {
          where: {
            status: 'SUBMITTED'
          },
          include: {
            participant: true,
            votes: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Calculate results per participant
    const resultsMap = new Map<string, {
      participantId: string
      name: string
      totalPercent: number
      voteCount: number
      voters: string[]
    }>()

    // Initialize results for all participants
    for (const participant of session.participants) {
      resultsMap.set(participant.id, {
        participantId: participant.id,
        name: participant.displayName,
        totalPercent: 0,
        voteCount: 0,
        voters: []
      })
    }

    // Aggregate votes
    for (const ballot of session.ballots) {
      const voterName = ballot.participant?.displayName || 'Unbekannt'
      
      for (const vote of ballot.votes) {
        const result = resultsMap.get(vote.personId)
        if (result) {
          result.totalPercent += vote.percent
          result.voteCount += 1
          // Only track voters if session is not anonymous
          if (!session.isAnonymous) {
            result.voters.push(voterName)
          }
        }
      }
    }

    // Calculate averages and format results
    let results = Array.from(resultsMap.values()).map(result => ({
      participantId: result.participantId,
      name: result.name,
      totalPercent: result.totalPercent,
      voteCount: result.voteCount,
      averagePercent: result.voteCount > 0 ? result.totalPercent / result.voteCount : 0,
      // Only include voters if not anonymous
      voters: session.isAnonymous ? undefined : result.voters,
      isFixedShare: false
    }))

    // Handle fixed shares based on mode
    const fixedShares = (session as any).fixedShares || []
    const fixedShareMode = (session as any).fixedShareMode
    const totalFixedPercent = fixedShares.reduce((sum: number, fs: any) => sum + fs.percent, 0)

    // For RESULTS_ONLY and PAYOUT_ONLY modes, add fixed shares to results
    // For TRANSPARENT modes, they're already factored into voting
    if (fixedShareMode === 'RESULTS_ONLY' || fixedShareMode === 'PAYOUT_ONLY') {
      // Scale down participant percentages to make room for fixed shares
      const scaleFactor = (100 - totalFixedPercent) / 100
      results = results.map(r => ({
        ...r,
        averagePercent: r.averagePercent * scaleFactor
      }))
    }

    // Add fixed shares to results for display (except PAYOUT_ONLY)
    const fixedShareResults = fixedShareMode !== 'PAYOUT_ONLY' 
      ? fixedShares.map((fs: any) => ({
          participantId: fs.id,
          name: fs.name,
          totalPercent: fs.percent,
          voteCount: 0,
          averagePercent: fs.percent,
          voters: undefined,
          isFixedShare: true
        }))
      : []

    // Return session without ballots details if anonymous
    const sessionResponse = {
      id: session.id,
      title: session.title,
      date: session.date,
      time: session.time,
      status: session.status,
      isAnonymous: session.isAnonymous,
      evaluationInfo: session.evaluationInfo,
      creatorId: session.creatorId,
      participants: session.participants,
      fixedShares: fixedShares,
      fixedShareMode: fixedShareMode,
      // Don't expose ballot details if anonymous
      ballots: session.isAnonymous ? [] : session.ballots
    }

    // Combine results with fixed shares
    const allResults = [...results, ...fixedShareResults]

    return NextResponse.json({
      session: sessionResponse,
      results: allResults,
      fixedShares: fixedShareResults,
      totalFixedPercent
    })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
