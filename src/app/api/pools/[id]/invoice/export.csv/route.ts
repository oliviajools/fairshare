import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computePoolResults } from '@/lib/pool-results'

function escapeCsv(value: any) {
  const s = value === null || value === undefined ? '' : String(value)
  const escaped = s.replaceAll('"', '""')
  return `"${escaped}"`
}

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
      select: { id: true, companyId: true, name: true },
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
      include: {
        customer: true,
        items: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    const items = (invoice.items || []) as any[]
    const netTotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

    const poolResults = await computePoolResults(poolId)
    const results = poolResults?.results || []
    const allocations = results.map((r) => ({
      ...r,
      amountNet: (netTotal * (Number(r.averagePercent) || 0)) / 100,
    }))

    const lines: string[] = []

    lines.push(['Section', 'Field', 'Value'].map(escapeCsv).join(','))
    lines.push(['invoice', 'pool', pool.name].map(escapeCsv).join(','))
    lines.push(['invoice', 'invoiceNumber', invoice.invoiceNumber || ''].map(escapeCsv).join(','))
    lines.push(['invoice', 'invoiceDate', invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString() : ''].map(escapeCsv).join(','))
    lines.push(['invoice', 'dueDate', invoice.dueDate ? new Date(invoice.dueDate).toISOString() : ''].map(escapeCsv).join(','))
    lines.push(['invoice', 'currency', invoice.currency || 'EUR'].map(escapeCsv).join(','))
    lines.push(['invoice', 'status', invoice.status].map(escapeCsv).join(','))
    lines.push(['invoice', 'netTotal', netTotal.toFixed(2)].map(escapeCsv).join(','))

    lines.push('')
    lines.push(['LineItems', 'Description', 'Quantity', 'UnitPriceNet', 'NetAmount', 'SessionId'].map(escapeCsv).join(','))
    for (const it of items) {
      const qty = Number(it.quantity) || 0
      const unit = Number(it.unitPrice) || 0
      const amount = qty * unit
      lines.push([
        'item',
        it.description,
        qty.toString(),
        unit.toFixed(2),
        amount.toFixed(2),
        it.sessionId || '',
      ].map(escapeCsv).join(','))
    }

    lines.push('')
    lines.push(['Allocations', 'Name', 'Percent', 'AmountNet', 'SessionCount', 'IsFixedShare'].map(escapeCsv).join(','))
    for (const a of allocations) {
      lines.push([
        'allocation',
        a.name,
        Number(a.averagePercent).toFixed(4),
        Number(a.amountNet).toFixed(2),
        String(a.sessionCount),
        a.isFixedShare ? 'true' : 'false',
      ].map(escapeCsv).join(','))
    }

    const csv = lines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice_${poolId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting invoice csv:', error)
    return NextResponse.json({ error: 'Fehler beim Export' }, { status: 500 })
  }
}
