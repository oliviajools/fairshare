import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function getOwner(companyId: string, email: string) {
  return prisma.companyMember.findFirst({
    where: {
      companyId,
      role: 'OWNER',
      user: { email },
    },
    select: { userId: true },
  })
}

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

    const owner = await getOwner(companyId, session.user.email)
    if (!owner) {
      return NextResponse.json({ error: 'Nur der Inhaber kann Mitglieder hinzufügen' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse erforderlich' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Für diese E-Mail-Adresse wurde kein Benutzer gefunden' }, { status: 404 })
    }

    const existing = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Dieser Benutzer ist bereits Mitglied' }, { status: 409 })
    }

    const membership = await prisma.companyMember.create({
      data: { companyId, userId: user.id, role: 'MEMBER' },
      select: { role: true, joinedAt: true },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding company member:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen des Mitglieds' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId } = await params

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const owner = await getOwner(companyId, session.user.email)
    if (!owner) {
      return NextResponse.json({ error: 'Nur der Inhaber kann Mitglieder entfernen' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = typeof body?.userId === 'string' ? body.userId : ''
    if (!userId) {
      return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 })
    }
    if (userId === owner.userId) {
      return NextResponse.json({ error: 'Der Inhaber kann nicht entfernt werden' }, { status: 400 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { role: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 })
    }
    if (membership.role === 'OWNER') {
      return NextResponse.json({ error: 'Der Inhaber kann nicht entfernt werden' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.companyGroupMember.deleteMany({
        where: { userId, group: { companyId } },
      }),
      prisma.companyMember.delete({
        where: { companyId_userId: { companyId, userId } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing company member:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen des Mitglieds' }, { status: 500 })
  }
}
