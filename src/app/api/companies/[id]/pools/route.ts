import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    const { id: companyId } = await params

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    const pools = await (prisma as any).pool.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      role: membership.role,
      pools: pools.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        sessionCount: p._count.sessions,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: p.createdBy?.name || p.createdBy?.email,
      })),
    })
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Pools' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    const { id: companyId } = await params

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff auf dieses Unternehmen' }, { status: 403 })
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const pool = await (prisma as any).pool.create({
      data: {
        companyId,
        name,
        createdById: user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ pool })
  } catch (error) {
    console.error('Error creating pool:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Pools' }, { status: 500 })
  }
}
