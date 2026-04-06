import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function canManageInvoice(role: string) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'FINANCE'
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
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    const quantity = typeof body?.quantity === 'number' ? body.quantity : parseFloat(body?.quantity)
    const unitPrice = typeof body?.unitPrice === 'number' ? body.unitPrice : parseFloat(body?.unitPrice)

    if (!description) {
      return NextResponse.json({ error: 'Beschreibung ist erforderlich' }, { status: 400 })
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Ungültige Menge' }, { status: 400 })
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: 'Ungültiger Preis' }, { status: 400 })
    }

    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null

    const item = await (prisma as any).invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description,
        quantity,
        unitPrice,
        sessionId,
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error adding invoice item:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der Position' }, { status: 500 })
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
    const itemId = typeof body?.itemId === 'string' ? body.itemId : ''

    if (!itemId) {
      return NextResponse.json({ error: 'itemId ist erforderlich' }, { status: 400 })
    }

    const item = await (prisma as any).invoiceLineItem.findUnique({
      where: { id: itemId },
      select: { id: true, invoiceId: true },
    })

    if (!item || item.invoiceId !== invoice.id) {
      return NextResponse.json({ error: 'Position nicht gefunden' }, { status: 404 })
    }

    await (prisma as any).invoiceLineItem.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice item:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen der Position' }, { status: 500 })
  }
}
