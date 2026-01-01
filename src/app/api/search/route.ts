import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Search users and companies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'users', 'companies', 'all'

    if (query.length < 2) {
      return NextResponse.json({ users: [], companies: [] })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    const results: { users: any[], companies: any[] } = {
      users: [],
      companies: []
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUser?.id } }, // Exclude current user
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          _count: {
            select: {
              createdSessions: true
            }
          }
        },
        take: 10
      })

      results.users = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        sessionCount: u._count.createdSessions
      }))
    }

    // Search companies
    if (type === 'all' || type === 'companies') {
      const companies = await prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              members: true,
              sessions: true
            }
          },
          members: {
            where: { userId: currentUser?.id },
            select: { role: true }
          }
        },
        take: 10
      })

      results.companies = companies.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        memberCount: c._count.members,
        sessionCount: c._count.sessions,
        isMember: c.members.length > 0,
        role: c.members[0]?.role || null
      }))
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Fehler bei der Suche' }, { status: 500 })
  }
}
