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
    const { id: poolId } = await params

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

    const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
      include: {
        company: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        sessions: {
          orderBy: { createdAt: 'asc' },
          include: {
            session: {
              select: {
                id: true,
                title: true,
                date: true,
                time: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: pool.companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    return NextResponse.json({
      role: membership.role,
      pool: {
        id: pool.id,
        name: pool.name,
        status: pool.status,
        company: pool.company,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
        createdBy: pool.createdBy?.name || pool.createdBy?.email,
        sessions: pool.sessions.map((ps: any) => ({
          id: ps.id,
          sessionId: ps.sessionId,
          weight: ps.weight,
          session: ps.session,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching pool:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Pools' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    const { id: poolId } = await params

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

    const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
      select: { id: true, companyId: true, status: true },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: pool.companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined
    const status = typeof body?.status === 'string' ? body.status : undefined

    if (status && status !== 'DRAFT' && status !== 'LOCKED') {
      return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })
    }

    const updated = await (prisma as any).pool.update({
      where: { id: poolId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      select: { id: true, name: true, status: true, updatedAt: true },
    })

    return NextResponse.json({ pool: updated })
  } catch (error) {
    console.error('Error updating pool:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Pools' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    const { id: poolId } = await params

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

    const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
      select: { id: true, companyId: true },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool nicht gefunden' }, { status: 404 })
    }

    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: pool.companyId,
          userId: user.id,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    await (prisma as any).pool.delete({ where: { id: poolId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pool:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Pools' }, { status: 500 })
  }
}
