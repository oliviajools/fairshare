import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function isAdminRole(role: string) {
  return role === 'OWNER' || role === 'ADMIN'
}

export async function POST(
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

    if (!isAdminRole(membership.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    if (pool.status === 'LOCKED') {
      return NextResponse.json({ error: 'Pool ist gesperrt' }, { status: 400 })
    }

    const body = await request.json()
    const sessionIds: string[] = Array.isArray(body?.sessionIds) ? body.sessionIds : []
    const weightsBySessionId: Record<string, number> =
      body?.weights && typeof body.weights === 'object' ? body.weights : {}

    const uniqueSessionIds = Array.from(new Set(sessionIds.filter((s) => typeof s === 'string' && s)))

    if (uniqueSessionIds.length === 0) {
      return NextResponse.json({ error: 'sessionIds ist erforderlich' }, { status: 400 })
    }

    const sessions = await prisma.votingSession.findMany({
      where: {
        id: { in: uniqueSessionIds },
        companyId: pool.companyId,
      },
      select: { id: true },
    })

    const foundIds = new Set(sessions.map((s) => s.id))
    const missing = uniqueSessionIds.filter((id) => !foundIds.has(id))

    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Einige Sessions gehören nicht zur Company oder existieren nicht', missing },
        { status: 400 }
      )
    }

    await (prisma as any).poolSession.createMany({
      data: uniqueSessionIds.map((sessionId) => ({
        poolId,
        sessionId,
        weight:
          typeof weightsBySessionId?.[sessionId] === 'number' && Number.isFinite(weightsBySessionId[sessionId])
            ? weightsBySessionId[sessionId]
            : 1,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding sessions to pool:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der Sessions' }, { status: 500 })
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

    if (!isAdminRole(membership.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    if (pool.status === 'LOCKED') {
      return NextResponse.json({ error: 'Pool ist gesperrt' }, { status: 400 })
    }

    const body = await request.json()
    const sessionIds: string[] = Array.isArray(body?.sessionIds) ? body.sessionIds : []
    const uniqueSessionIds = Array.from(new Set(sessionIds.filter((s) => typeof s === 'string' && s)))

    if (uniqueSessionIds.length === 0) {
      return NextResponse.json({ error: 'sessionIds ist erforderlich' }, { status: 400 })
    }

    await (prisma as any).poolSession.deleteMany({
      where: {
        poolId,
        sessionId: { in: uniqueSessionIds },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing sessions from pool:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen der Sessions' }, { status: 500 })
  }
}
