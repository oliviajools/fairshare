import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch company details with sessions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if user is member of company
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: id,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        sessions: {
          include: {
            _count: {
              select: {
                participants: true,
                ballots: true
              }
            },
            creator: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      logo: (company as any).logo,
      domain: (company as any).domain,
      role: membership.role,
      members: company.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      sessions: company.sessions.map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        time: s.time,
        status: s.status,
        creatorName: s.creator?.name || s.creator?.email,
        participantCount: s._count.participants,
        ballotCount: s._count.ballots,
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Unternehmens' }, { status: 500 })
  }
}

// PUT - Update company (name, description, logo, domain)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if user is owner or admin
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: id,
          userId: user.id
        }
      }
    })

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Bearbeiten' }, { status: 403 })
    }

    const { name, description, logo, domain } = await request.json()

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(logo !== undefined && { logo }),
        ...(domain !== undefined && { domain: domain?.trim() || null })
      }
    })

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      logo: (company as any).logo,
      domain: (company as any).domain
    })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}
