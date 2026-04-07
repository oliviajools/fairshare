import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: companyId } = await params

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = typeof body?.userId === 'string' ? body.userId : ''
    const role = typeof body?.role === 'string' ? body.role : ''

    if (!userId) {
      return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 })
    }

    if (!['MEMBER', 'FINANCE', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })
    }

    const actingMembership = await prisma.companyMember.findFirst({
      where: {
        companyId,
        user: { email: session.user.email },
      },
      select: { role: true, userId: true },
    })

    if (!actingMembership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    if (actingMembership.role !== 'OWNER' && actingMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 })
    }

    const updated = await prisma.companyMember.update({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      data: { role },
      select: {
        userId: true,
        role: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Rolle' }, { status: 500 })
  }
}
