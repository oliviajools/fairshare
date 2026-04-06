import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computePoolResults } from '@/lib/pool-results'

function canManageInvoice(role: string) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'FINANCE'
}

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

    const invoice = await (prisma as any).poolInvoice.findUnique({
      where: { poolId },
      include: {
        customer: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const poolResults = await computePoolResults(poolId)

    const items = (invoice?.items || []) as any[]
    const netTotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

    const results = poolResults?.results || []
    const allocations = results.map((r) => ({
      ...r,
      amountNet: (netTotal * (Number(r.averagePercent) || 0)) / 100,
    }))

    return NextResponse.json({
      role: membership.role,
      canManage: canManageInvoice(membership.role),
      invoice,
      netTotal,
      allocations,
    })
  } catch (error) {
    console.error('Error fetching pool invoice:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnung' }, { status: 500 })
  }
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

    if (!membership || !canManageInvoice(membership.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const existing = await (prisma as any).poolInvoice.findUnique({
      where: { poolId },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ error: 'Rechnung existiert bereits' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const customerId = typeof body?.customerId === 'string' ? body.customerId : null

    const invoice = await (prisma as any).poolInvoice.create({
      data: {
        poolId,
        companyId: pool.companyId,
        customerId,
        createdById: user.id,
        currency: typeof body?.currency === 'string' && body.currency ? body.currency : 'EUR',
        notes: typeof body?.notes === 'string' ? body.notes : null,
      },
      include: {
        customer: true,
        items: true,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error creating pool invoice:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Rechnung' }, { status: 500 })
  }
}

export async function PUT(
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

    if (!membership || !canManageInvoice(membership.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const invoice = await (prisma as any).poolInvoice.findUnique({
      where: { poolId },
      select: { id: true, status: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (invoice.status === 'FINAL') {
      return NextResponse.json({ error: 'Rechnung ist finalisiert' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    const updated = await (prisma as any).poolInvoice.update({
      where: { poolId },
      data: {
        customerId: typeof body?.customerId === 'string' ? body.customerId : undefined,
        invoiceNumber: typeof body?.invoiceNumber === 'string' ? body.invoiceNumber : undefined,
        invoiceDate: body?.invoiceDate ? new Date(body.invoiceDate) : undefined,
        dueDate: body?.dueDate ? new Date(body.dueDate) : undefined,
        currency: typeof body?.currency === 'string' && body.currency ? body.currency : undefined,
        notes: typeof body?.notes === 'string' ? body.notes : undefined,
      },
      include: {
        customer: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ invoice: updated })
  } catch (error) {
    console.error('Error updating pool invoice:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Rechnung' }, { status: 500 })
  }
}
