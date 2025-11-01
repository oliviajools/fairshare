import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        participants: true,
        ballots: {
          where: { status: 'SUBMITTED' },
          include: { votes: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Session is not closed yet' }, { status: 403 })
    }

    // Calculate results - always ignore missing votes
    const results = []
    const submittedBallots = session.ballots.filter(b => b.status === 'SUBMITTED')
    const totalSubmissions = submittedBallots.length

    for (const participant of session.participants) {
      const votesForPerson = []
      
      // Collect all votes for this person
      for (const ballot of submittedBallots) {
        const vote = ballot.votes.find(v => v.personId === participant.id)
        if (vote) {
          votesForPerson.push(vote.percent)
        }
        // Missing votes are always ignored
      }

      let meanPercent = 0
      let numRatings = votesForPerson.length

      if (votesForPerson.length > 0) {
        meanPercent = votesForPerson.reduce((sum, percent) => sum + percent, 0) / votesForPerson.length
      }

      results.push({
        participantId: participant.id,
        displayName: participant.displayName,
        meanPercent: Math.round(meanPercent * 100) / 100, // Round to 2 decimal places
        numRatings,
        totalSubmissions
      })
    }

    // Sort results by mean percent (descending)
    results.sort((a, b) => b.meanPercent - a.meanPercent)

    return NextResponse.json({
      session,
      results,
      totalSubmissions
    })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
