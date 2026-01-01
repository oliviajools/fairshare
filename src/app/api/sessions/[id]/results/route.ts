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
    const results = Array.from(resultsMap.values()).map(result => ({
      participantId: result.participantId,
      name: result.name,
      totalPercent: result.totalPercent,
      voteCount: result.voteCount,
      averagePercent: result.voteCount > 0 ? result.totalPercent / result.voteCount : 0,
      // Only include voters if not anonymous
      voters: session.isAnonymous ? undefined : result.voters
    }))

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
      // Don't expose ballot details if anonymous
      ballots: session.isAnonymous ? [] : session.ballots
    }

    return NextResponse.json({
      session: sessionResponse,
      results
    })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
