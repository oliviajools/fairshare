import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch all groups for a company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId } = await params
    
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
          companyId,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    const groups = await prisma.companyGroup.findMany({
      where: { companyId },
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
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group.members.length,
      members: group.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email
      }))
    })))
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Gruppen' }, { status: 500 })
  }
}

// POST - Create a new group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if user is member of company (any member can create groups)
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    const { name, description, memberIds } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Gruppenname ist erforderlich' }, { status: 400 })
    }

    // Check if group name already exists in company
    const existingGroup = await prisma.companyGroup.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: name.trim()
        }
      }
    })

    if (existingGroup) {
      return NextResponse.json({ error: 'Eine Gruppe mit diesem Namen existiert bereits' }, { status: 400 })
    }

    // Verify all memberIds are company members
    if (memberIds && memberIds.length > 0) {
      const companyMembers = await prisma.companyMember.findMany({
        where: {
          companyId,
          userId: { in: memberIds }
        }
      })

      if (companyMembers.length !== memberIds.length) {
        return NextResponse.json({ error: 'Einige Benutzer sind keine Mitglieder dieses Unternehmens' }, { status: 400 })
      }
    }

    const group = await prisma.companyGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        companyId,
        members: {
          create: (memberIds || []).map((userId: string) => ({
            userId
          }))
        }
      },
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
        }
      }
    })

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group.members.length,
      members: group.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email
      }))
    })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Gruppe' }, { status: 500 })
  }
}
