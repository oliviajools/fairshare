import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireOwner(companyId: string, email: string) {
  return prisma.companyMember.findFirst({
    where: {
      companyId,
      role: 'OWNER',
      user: { email },
    },
    select: { userId: true },
  })
}

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
    if (!await requireOwner(companyId, session.user.email)) {
      return NextResponse.json({ error: 'Nur der Inhaber kann Beitrittsanfragen sehen' }, { status: 403 })
    }

    const requests = await prisma.companyJoinRequest.findMany({
      where: { companyId, status: 'PENDING' },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(requests.map((joinRequest) => ({
      id: joinRequest.id,
      userId: joinRequest.user.id,
      name: joinRequest.user.name,
      email: joinRequest.user.email,
      createdAt: joinRequest.createdAt,
    })))
  } catch (error) {
    console.error('Error fetching company join requests:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Beitrittsanfragen' }, { status: 500 })
  }
}

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
    if (!await requireOwner(companyId, session.user.email)) {
      return NextResponse.json({ error: 'Nur der Inhaber kann Beitrittsanfragen bearbeiten' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const requestId = typeof body?.requestId === 'string' ? body.requestId : ''
    const action = typeof body?.action === 'string' ? body.action : ''
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }

    const joinRequest = await prisma.companyJoinRequest.findFirst({
      where: { id: requestId, companyId, status: 'PENDING' },
      select: {
        id: true,
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
    if (!joinRequest) {
      return NextResponse.json({ error: 'Offene Beitrittsanfrage nicht gefunden' }, { status: 404 })
    }

    if (action === 'reject') {
      await prisma.companyJoinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'REJECTED' },
      })
      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    const [, membership] = await prisma.$transaction([
      prisma.companyJoinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'APPROVED' },
      }),
      prisma.companyMember.upsert({
        where: { companyId_userId: { companyId, userId: joinRequest.userId } },
        update: {},
        create: { companyId, userId: joinRequest.userId, role: 'MEMBER' },
        select: { role: true, joinedAt: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      status: 'APPROVED',
      member: {
        id: joinRequest.user.id,
        name: joinRequest.user.name,
        email: joinRequest.user.email,
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
    })
  } catch (error) {
    console.error('Error updating company join request:', error)
    return NextResponse.json({ error: 'Fehler beim Bearbeiten der Beitrittsanfrage' }, { status: 500 })
  }
}
