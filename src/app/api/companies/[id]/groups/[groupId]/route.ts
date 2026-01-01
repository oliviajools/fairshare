import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch a specific group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId, groupId } = await params
    
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

    const group = await prisma.companyGroup.findFirst({
      where: { id: groupId, companyId },
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

    if (!group) {
      return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
    }

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
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Gruppe' }, { status: 500 })
  }
}

// PUT - Update a group (name, description, members)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId, groupId } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if user is member of company (any member can edit groups)
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

    const group = await prisma.companyGroup.findFirst({
      where: { id: groupId, companyId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
    }

    const { name, description, memberIds } = await request.json()

    // Check if new name already exists (if name changed)
    if (name && name.trim() !== group.name) {
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

    // Update group and members in a transaction
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // Update group details
      const updated = await tx.companyGroup.update({
        where: { id: groupId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description?.trim() || null })
        }
      })

      // Update members if provided
      if (memberIds !== undefined) {
        // Remove all existing members
        await tx.companyGroupMember.deleteMany({
          where: { groupId }
        })

        // Add new members
        if (memberIds.length > 0) {
          await tx.companyGroupMember.createMany({
            data: memberIds.map((userId: string) => ({
              groupId,
              userId
            }))
          })
        }
      }

      // Fetch updated group with members
      return tx.companyGroup.findUnique({
        where: { id: groupId },
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
    })

    if (!updatedGroup) {
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Gruppe' }, { status: 500 })
    }

    return NextResponse.json({
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      memberCount: updatedGroup.members.length,
      members: updatedGroup.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email
      }))
    })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Gruppe' }, { status: 500 })
  }
}

// DELETE - Delete a group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId, groupId } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if user is admin or owner
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id
        }
      }
    })

    if (!membership || membership.role === 'MEMBER') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Gruppen' }, { status: 403 })
    }

    const group = await prisma.companyGroup.findFirst({
      where: { id: groupId, companyId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
    }

    await prisma.companyGroup.delete({
      where: { id: groupId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Gruppe' }, { status: 500 })
  }
}
