import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Leave a group
export async function POST(
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

    // Check if group exists
    const group = await prisma.companyGroup.findFirst({
      where: { id: groupId, companyId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
    }

    // Check if user is member of the group
    const groupMembership = await prisma.companyGroupMember.findFirst({
      where: {
        groupId,
        userId: user.id
      }
    })

    if (!groupMembership) {
      return NextResponse.json({ error: 'Du bist kein Mitglied dieser Gruppe' }, { status: 400 })
    }

    // Remove user from group
    await prisma.companyGroupMember.delete({
      where: { id: groupMembership.id }
    })

    return NextResponse.json({ success: true, message: 'Du hast die Gruppe verlassen' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Fehler beim Verlassen der Gruppe' }, { status: 500 })
  }
}
