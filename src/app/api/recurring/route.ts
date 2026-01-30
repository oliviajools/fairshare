import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List recurring sessions for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurring = await prisma.recurringSession.findMany({
      where: { creatorId: session.user.id },
      include: {
        _count: { select: { sessions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(recurring)
  } catch (error) {
    console.error('Error fetching recurring sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new recurring session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, frequency, dayOfWeek, dayOfMonth, time, evaluationInfo, isAnonymous, companyId, groupId } = body

    if (!title || !frequency) {
      return NextResponse.json({ error: 'Title and frequency required' }, { status: 400 })
    }

    // Calculate next run date
    const nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, time)

    const recurring = await prisma.recurringSession.create({
      data: {
        title,
        frequency,
        dayOfWeek,
        dayOfMonth,
        time,
        evaluationInfo,
        isAnonymous: isAnonymous ?? true,
        creatorId: session.user.id,
        companyId,
        groupId,
        nextRunAt
      }
    })

    return NextResponse.json(recurring, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateNextRun(frequency: string, dayOfWeek?: number, dayOfMonth?: number, time?: string): Date {
  const now = new Date()
  const [hours, minutes] = (time || '09:00').split(':').map(Number)
  
  let nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'WEEKLY':
      if (dayOfWeek !== undefined) {
        const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7
        nextRun.setDate(now.getDate() + daysUntil)
      }
      break
    case 'BIWEEKLY':
      if (dayOfWeek !== undefined) {
        const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 14
        nextRun.setDate(now.getDate() + daysUntil)
      }
      break
    case 'MONTHLY':
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
      }
      break
    case 'QUARTERLY':
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth)
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const nextQuarterStart = (currentQuarter + 1) * 3
        nextRun.setMonth(nextQuarterStart)
      }
      break
  }

  return nextRun
}
