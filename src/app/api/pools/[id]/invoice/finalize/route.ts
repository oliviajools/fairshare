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
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (invoice.status === 'FINAL') {
      return NextResponse.json({ invoice })
    }

    if (!invoice.invoiceNumber) {
      return NextResponse.json({ error: 'Rechnungsnummer fehlt' }, { status: 400 })
    }

    if (!invoice.invoiceDate) {
      return NextResponse.json({ error: 'Rechnungsdatum fehlt' }, { status: 400 })
    }

    if (!invoice.items || invoice.items.length === 0) {
      return NextResponse.json({ error: 'Keine Positionen vorhanden' }, { status: 400 })
    }

    const updated = await (prisma as any).poolInvoice.update({
      where: { poolId },
      data: {
        status: 'FINAL',
        finalizedAt: new Date(),
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
    console.error('Error finalizing invoice:', error)
    return NextResponse.json({ error: 'Fehler beim Finalisieren' }, { status: 500 })
  }
}
