import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Admin statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalUsers,
      totalSessions,
      totalCompanies,
      usersThisMonth,
      sessionsThisMonth,
      usersLastMonth,
      sessionsLastMonth,
      recentSessions,
      topCompanies
    ] = await Promise.all([
      prisma.user.count(),
      prisma.votingSession.count(),
      prisma.company.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.votingSession.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      prisma.votingSession.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      prisma.votingSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { name: true, email: true } },
          company: { select: { name: true } },
          _count: { select: { participants: true, ballots: true } }
        }
      }),
      prisma.company.findMany({
        take: 5,
        orderBy: { sessions: { _count: 'desc' } },
        include: {
          _count: { select: { members: true, sessions: true } }
        }
      })
    ])

    // Calculate growth rates
    const userGrowth = usersLastMonth > 0 
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) 
      : 100
    const sessionGrowth = sessionsLastMonth > 0 
      ? Math.round(((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) * 100) 
      : 100

    return NextResponse.json({
      overview: {
        totalUsers,
        totalSessions,
        totalCompanies,
        usersThisMonth,
        sessionsThisMonth,
        userGrowth,
        sessionGrowth
      },
      recentSessions,
      topCompanies
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
