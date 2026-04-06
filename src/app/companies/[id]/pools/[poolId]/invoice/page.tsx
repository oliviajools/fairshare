'use client'

import { useCallback, useEffect, useMemo, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { ArrowLeft, FileText, Plus, Trash2, Download, CheckCircle2 } from 'lucide-react'

type InvoiceStatus = 'DRAFT' | 'FINAL'

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  sessionId?: string | null
}

type PoolInvoice = {
  id: string
  poolId: string
  status: InvoiceStatus
  invoiceNumber?: string | null
  invoiceDate?: string | null
  dueDate?: string | null
  currency: string
  notes?: string | null
  customerId?: string | null
  createdAt: string
  updatedAt: string
  finalizedAt?: string | null
  items: InvoiceItem[]
}

type Allocation = {
  key: string
  name: string
  averagePercent: number
  amountNet: number
  sessionCount: number
  isFixedShare: boolean
}

type InvoiceGetResponse = {
  role: 'OWNER' | 'ADMIN' | 'FINANCE' | 'MEMBER'
  canManage: boolean
  invoice: PoolInvoice | null
  netTotal: number
  allocations: Allocation[]
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function PoolInvoicePage({
  params,
}: {
  params: Promise<{ id: string; poolId: string }>
}) {
  const { id: companyId, poolId } = use(params)
  const router = useRouter()
  const { status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [role, setRole] = useState<InvoiceGetResponse['role'] | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [invoice, setInvoice] = useState<PoolInvoice | null>(null)
  const [netTotal, setNetTotal] = useState(0)
  const [allocations, setAllocations] = useState<Allocation[]>([])

  const currency = invoice?.currency || 'EUR'
  const isFinal = invoice?.status === 'FINAL'

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('0')

  const canEdit = useMemo(() => canManage && !isFinal, [canManage, isFinal])

  const fetchInvoice = useCallback(async () => {
    setError(null)
    const res = await fetch(`/api/pools/${poolId}/invoice`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || 'Fehler beim Laden der Rechnung')
    }
    const data: InvoiceGetResponse = await res.json()
    setRole(data.role)
    setCanManage(Boolean(data.canManage))
    setInvoice(data.invoice)
    setNetTotal(Number(data.netTotal) || 0)
    setAllocations(Array.isArray(data.allocations) ? data.allocations : [])

    const inv = data.invoice
    setInvoiceNumber(inv?.invoiceNumber || '')
    setInvoiceDate(inv?.invoiceDate ? String(inv.invoiceDate).slice(0, 10) : '')
    setDueDate(inv?.dueDate ? String(inv.dueDate).slice(0, 10) : '')
  }, [poolId])

  const ensureInvoice = useCallback(async () => {
    if (invoice) return

    const res = await fetch(`/api/pools/${poolId}/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'EUR' }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error || 'Fehler beim Erstellen der Rechnung')
    }
  }, [invoice, poolId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status !== 'authenticated') return

    const run = async () => {
      setLoading(true)
      try {
        await fetchInvoice()
        if (!invoice) {
          await ensureInvoice()
          await fetchInvoice()
        }
      } catch (e: any) {
        setError(e?.message || 'Fehler')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [status, router, fetchInvoice, ensureInvoice, invoice])

  const saveInvoiceMeta = async () => {
    if (!canEdit) return
    try {
      const res = await fetch(`/api/pools/${poolId}/invoice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber || null,
          invoiceDate: invoiceDate || null,
          dueDate: dueDate || null,
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Fehler beim Speichern')
      }

      await fetchInvoice()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const addItem = async () => {
    if (!canEdit) return
    const qty = parseFloat(newQty)
    const unit = parseFloat(newUnit)

    try {
      const res = await fetch(`/api/pools/${poolId}/invoice/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newDesc,
          quantity: qty,
          unitPrice: unit,
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Fehler beim Hinzufügen')
      }

      setNewDesc('')
      setNewQty('1')
      setNewUnit('0')
      await fetchInvoice()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!canEdit) return
    try {
      const res = await fetch(`/api/pools/${poolId}/invoice/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Fehler beim Entfernen')
      }

      await fetchInvoice()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const finalize = async () => {
    if (!canManage || isFinal) return
    if (!confirm('Rechnung wirklich finalisieren? Danach ist sie nicht mehr editierbar.')) return

    try {
      const res = await fetch(`/api/pools/${poolId}/invoice/finalize`, {
        method: 'POST',
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Fehler beim Finalisieren')
      }

      await fetchInvoice()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={() => router.push(`/companies/${companyId}/pools/${poolId}`)}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <FileText className="h-8 w-8 text-sky-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Rechnung</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>Rolle: {role || '-'}</span>
                <Badge variant={isFinal ? 'secondary' : 'default'}>{isFinal ? 'Final' : 'Entwurf'}</Badge>
                <span className="text-gray-400">•</span>
                <Link href={`/api/pools/${poolId}/invoice/export.csv`} className="text-sky-600 hover:underline inline-flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  CSV Export
                </Link>
              </div>
            </div>
            {canManage && (
              <Button onClick={finalize} disabled={isFinal} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalisieren
              </Button>
            )}
          </div>

          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="py-4 text-red-700">{error}</CardContent>
            </Card>
          )}

          {!canManage && (
            <Card className="mb-6 border-amber-200">
              <CardContent className="py-4 text-amber-700">
                Du hast keine Berechtigung, eine Rechnung zu erstellen oder zu bearbeiten.
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rechnungsdaten</CardTitle>
                  <CardDescription>Nur relevant für den externen Rechnungslauf</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Rechnungsnummer</label>
                      <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Rechnungsdatum</label>
                      <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Fällig am</label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={!canEdit} />
                    </div>
                  </div>

                  {canEdit && (
                    <Button onClick={saveInvoiceMeta} className="bg-sky-500 hover:bg-sky-600">
                      Speichern
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Positionen (Netto)</CardTitle>
                  <CardDescription>Manuell hinzufügen (Session-Ableitung kommt als nächster Schritt)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice?.items?.length ? (
                    <div className="space-y-2">
                      {invoice.items.map((it) => {
                        const amount = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                        return (
                          <div key={it.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white border border-gray-100">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{it.description}</p>
                              <p className="text-xs text-gray-500">
                                {it.quantity} x {formatCurrency(it.unitPrice, currency)} = {formatCurrency(amount, currency)}
                              </p>
                            </div>
                            {canEdit && (
                              <Button variant="ghost" size="icon" onClick={() => deleteItem(it.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Noch keine Positionen.</div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Beschreibung</label>
                      <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600">Menge</label>
                        <Input value={newQty} onChange={(e) => setNewQty(e.target.value)} disabled={!canEdit} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Einzelpreis (Netto)</label>
                        <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} disabled={!canEdit} />
                      </div>
                    </div>
                    {canEdit && (
                      <Button onClick={addItem} disabled={!newDesc.trim()} className="bg-sky-500 hover:bg-sky-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Position hinzufügen
                      </Button>
                    )}
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-600">Summe Netto</span>
                    <span className="font-bold text-gray-900">{formatCurrency(netTotal, currency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interne Verteilung (Netto)</CardTitle>
                  <CardDescription>Auf Basis der Pool-Ergebnisse</CardDescription>
                </CardHeader>
                <CardContent>
                  {allocations.length === 0 ? (
                    <div className="text-sm text-gray-600">Keine Verteilung verfügbar (keine Pool-Ergebnisse).</div>
                  ) : (
                    <div className="space-y-2">
                      {allocations.map((a) => (
                        <div key={a.key} className={`p-3 rounded-lg ${a.isFixedShare ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{a.name}</p>
                              <p className="text-xs text-gray-500">{a.averagePercent.toFixed(2)}% • {a.sessionCount} Sessions</p>
                            </div>
                            <div className={`font-bold ${a.isFixedShare ? 'text-amber-700' : 'text-sky-700'}`}>
                              {formatCurrency(a.amountNet, currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nächster Schritt</CardTitle>
                  <CardDescription>„Positionen aus Sessions“</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Diese Seite unterstützt bereits manuelle Positionen + CSV-Export + interne Netto-Verteilung.
                  
                  Als nächstes ergänzen wir einen Button „Aus Pool-Sessions übernehmen“, der pro Session automatisch eine Position erzeugt (z.B. 1x Pauschale / Stunden / frei definierter Satz).
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
