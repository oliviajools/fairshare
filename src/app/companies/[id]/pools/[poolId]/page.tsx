'use client'

import { useCallback, useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BottomNav } from '@/components/BottomNav'
import { ArrowLeft, Calendar, Layers, Plus, Minus, BarChart3, RefreshCw, FileText } from 'lucide-react'

type PoolStatus = 'DRAFT' | 'LOCKED'

type PoolSessionItem = {
  id: string
  sessionId: string
  weight: number
  session: {
    id: string
    title: string
    date: string | null
    time: string | null
    status: 'OPEN' | 'CLOSED'
    createdAt: string
  } | null
}

type PoolDetailResponse = {
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  pool: {
    id: string
    name: string
    status: PoolStatus
    company: { id: string; name: string; slug: string }
    createdAt: string
    updatedAt: string
    createdBy?: string
    sessions: PoolSessionItem[]
  }
}

type AggregatedResult = {
  key: string
  name: string
  totalPercent: number
  averagePercent: number
  sessionCount: number
  isFixedShare: boolean
}

type PoolResultsResponse = {
  pool: { id: string; name: string; status: PoolStatus }
  results: AggregatedResult[]
  sessionCount: number
}

type CompanySession = {
  id: string
  title: string
  date: string | null
  time: string | null
  status: 'OPEN' | 'CLOSED'
  creatorName: string | null
  participantCount: number
  ballotCount: number
  hasInvoiceItem: boolean
  createdAt: string
}

type CompanyResponse = {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  members: any[]
  sessions: CompanySession[]
}

function formatDate(dateString: string | null) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export default function PoolDetailPage({ params }: { params: Promise<{ id: string; poolId: string }> }) {
  const { id: companyId, poolId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pool, setPool] = useState<PoolDetailResponse['pool'] | null>(null)
  const [role, setRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null)

  const [companySessions, setCompanySessions] = useState<CompanySession[]>([])
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<CompanySession | null>(null)
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)

  const [results, setResults] = useState<AggregatedResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)

  const canEdit = useMemo(() => role === 'OWNER' || role === 'ADMIN', [role])

  const poolSessionIds = useMemo(() => new Set((pool?.sessions || []).map((ps) => ps.sessionId)), [pool?.sessions])

  const suggestedSessions = useMemo(() => {
    const sessions = [...companySessions]
    // Sort by invoice status: sessions without invoice first
    sessions.sort((a, b) => {
      if (a.hasInvoiceItem === b.hasInvoiceItem) return 0
      return a.hasInvoiceItem ? 1 : -1
    })
    return sessions
  }, [companySessions])

  const fetchPool = useCallback(async () => {
    const res = await fetch(`/api/pools/${poolId}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || 'Fehler beim Laden des Pools')
    }
    const data: PoolDetailResponse = await res.json()
    setRole(data.role)
    setPool(data.pool)
  }, [poolId])

  const fetchCompanySessions = useCallback(async () => {
    setLoadingCompany(true)
    try {
      const res = await fetch(`/api/companies/${companyId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Fehler beim Laden der Sessions')
      }
      const data: CompanyResponse = await res.json()
      console.log('Loaded sessions:', data.sessions.length, data.sessions)
      setCompanySessions(data.sessions)
    } catch (e: any) {
      console.error('Error fetching company sessions:', e)
      setError(`Fehler beim Laden der Sessions: ${e?.message}`)
    } finally {
      setLoadingCompany(false)
    }
  }, [companyId])

  const fetchResults = useCallback(async () => {
    setLoadingResults(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/results`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Fehler beim Laden der Ergebnisse')
      }
      const data: PoolResultsResponse = await res.json()
      setResults(data.results)
    } finally {
      setLoadingResults(false)
    }
  }, [poolId])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchPool(), fetchCompanySessions()])
      await fetchResults()
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [fetchCompanySessions, fetchPool, fetchResults])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      void loadAll()
    }
  }, [status, router, loadAll])

  const addSessions = async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return
    const unique = Array.from(new Set(sessionIds))

    const res = await fetch(`/api/pools/${poolId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: unique }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error || 'Fehler beim Hinzufügen der Sessions')
    }

    await fetchPool()
    await fetchResults()
  }

  const removeSessions = async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return
    const unique = Array.from(new Set(sessionIds))

    const res = await fetch(`/api/pools/${poolId}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: unique }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error || 'Fehler beim Entfernen der Sessions')
    }

    await fetchPool()
    await fetchResults()
  }

  const handleAddSuggested = async () => {
    try {
      const toAdd = suggestedSessions.filter((s) => !poolSessionIds.has(s.id)).map((s) => s.id)
      await addSessions(toAdd)
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const handleRemoveAll = async () => {
    try {
      const toRemove = (pool?.sessions || []).map((ps) => ps.sessionId)
      await removeSessions(toRemove)
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const handleAddSelected = async () => {
    try {
      const toAdd = Array.from(selectedSessionIds).filter((id) => !poolSessionIds.has(id))
      await addSessions(toAdd)
      setSelectedSessionIds(new Set())
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const handleRemoveSelected = async () => {
    try {
      const toRemove = Array.from(selectedSessionIds)
      await removeSessions(toRemove)
      setSelectedSessionIds(new Set())
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const handleDragStart = (sessionId: string) => {
    setDraggedSessionId(sessionId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedSessionId || !canEdit || pool?.status === 'LOCKED') return

    try {
      await addSessions([draggedSessionId])
    } catch (error) {
      console.error('Error adding session:', error)
    }
    setDraggedSessionId(null)
  }

  const handleDragEnd = () => {
    setDraggedSessionId(null)
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

  if (!pool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center pb-20">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-gray-700">Pool nicht gefunden</p>
            <Button className="mt-4" onClick={() => router.push(`/companies/${companyId}/pools`)}>
              Zurück
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={() => router.push(`/companies/${companyId}/pools`)}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Layers className="h-8 w-8 text-sky-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{pool.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {pool.sessions.length} Session{pool.sessions.length !== 1 ? 's' : ''}
                </span>
                <Badge variant={pool.status === 'LOCKED' ? 'secondary' : 'default'}>
                  {pool.status === 'LOCKED' ? 'Gesperrt' : 'Entwurf'}
                </Badge>
                <span className="text-gray-400">•</span>
                <Link href={`/companies/${companyId}`} className="text-sky-600 hover:underline">
                  {pool.company.name}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/companies/${companyId}/pools/${poolId}/invoice`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Rechnung
                </Button>
              </Link>
              <Button variant="outline" onClick={fetchResults} disabled={loadingResults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="py-4 text-red-700">{error}</CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Pool-Ergebnisse
                  </CardTitle>
                  <CardDescription>Aggregierte Verteilung über alle Sessions im Pool</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingResults ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-gray-600 text-sm">Noch keine Ergebnisse (oder keine Stimmen in den Sessions).</div>
                  ) : (
                    <div className="space-y-3">
                      {results.map((r) => (
                        <div key={r.key} className={`p-3 rounded-lg ${r.isFixedShare ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{r.name}</p>
                              <p className="text-xs text-gray-500">{r.sessionCount} Session{r.sessionCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div className={`font-bold ${r.isFixedShare ? 'text-amber-700' : 'text-sky-700'}`}>
                              {r.averagePercent.toFixed(1)}%
                            </div>
                          </div>
                          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${r.isFixedShare ? 'bg-amber-500' : 'bg-sky-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, r.averagePercent))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                onDragOver={canEdit && pool.status !== 'LOCKED' ? handleDragOver : undefined}
                onDrop={canEdit && pool.status !== 'LOCKED' ? handleDrop : undefined}
                className={canEdit && pool.status !== 'LOCKED' && draggedSessionId ? 'border-2 border-sky-400 bg-sky-50' : ''}
              >
                <CardHeader>
                  <CardTitle>Sessions im Pool</CardTitle>
                  <CardDescription>
                    {draggedSessionId ? 'Lass los, um Session hinzuzufügen' : 'Aktuell enthaltene Sessions'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pool.sessions.length === 0 ? (
                    <div className="text-gray-600 text-sm">Noch keine Sessions im Pool.</div>
                  ) : (
                    <div className="space-y-2">
                      {pool.sessions.map((ps) => (
                        <div key={ps.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-100">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{ps.session?.title || ps.sessionId}</p>
                            <p className="text-xs text-gray-500">
                              {ps.session?.date ? formatDate(ps.session.date) : 'ohne Datum'}
                              {ps.session?.status ? ` • ${ps.session.status === 'CLOSED' ? 'Beendet' : 'Offen'}` : ''}
                            </p>
                          </div>
                          {canEdit && pool.status !== 'LOCKED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await removeSessions([ps.sessionId])
                                } catch (e: any) {
                                  alert(e?.message || 'Fehler')
                                }
                              }}
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Entfernen
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canEdit && pool.status !== 'LOCKED' && pool.sessions.length > 0 && (
                    <Button variant="outline" className="mt-4 w-full" onClick={handleRemoveAll}>
                      Alle entfernen
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>
                    {loadingCompany ? 'Lädt…' : `${companySessions.length} Session${companySessions.length !== 1 ? 's' : ''} gesamt`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestedSessions.length === 0 ? (
                    <div className="text-sm text-gray-600">Keine Sessions gefunden.</div>
                  ) : (
                    <>
                      {canEdit && pool.status !== 'LOCKED' && selectedSessionIds.size > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Button
                            size="sm"
                            onClick={handleAddSelected}
                            className="bg-sky-500 hover:bg-sky-600 whitespace-normal break-words"
                          >
                            <Plus className="h-4 w-4 mr-2 shrink-0" />
                            Ausgewählte hinzufügen ({selectedSessionIds.size})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveSelected}
                            className="whitespace-normal break-words"
                          >
                            <Minus className="h-4 w-4 mr-2 shrink-0" />
                            Ausgewählte entfernen ({selectedSessionIds.size})
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSessionIds(new Set())}
                            className="whitespace-normal break-words"
                          >
                            Auswahl aufheben
                          </Button>
                        </div>
                      )}
                      
                      {/* Sessions ohne Rechnungsbeitrag */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Noch nicht in Rechnung aufgeführt</h4>
                        <div className="space-y-2">
                          {suggestedSessions.filter(s => !s.hasInvoiceItem).map((s) => {
                            const isInPool = poolSessionIds.has(s.id)
                            const isSelected = selectedSessionIds.has(s.id)
                            return (
                              <div 
                                key={s.id} 
                                draggable={!isInPool && canEdit && pool.status !== 'LOCKED'}
                                onDragStart={() => handleDragStart(s.id)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg ${isSelected ? 'bg-sky-50 border-sky-200' : 'bg-white border-gray-100'} border cursor-pointer hover:bg-gray-50 ${!isInPool && canEdit && pool.status !== 'LOCKED' ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                                onClick={() => setSelectedSessionForDetails(s)}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {canEdit && pool.status !== 'LOCKED' && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        toggleSessionSelection(s.id)
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{s.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(s.date) || 'ohne Datum'}
                                      {s.status ? ` • ${s.status === 'CLOSED' ? 'Beendet' : 'Offen'}` : ''}
                                    </p>
                                  </div>
                                </div>
                                {canEdit && pool.status !== 'LOCKED' && !isInPool && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addSessions([s.id])
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                          {suggestedSessions.filter(s => !s.hasInvoiceItem).length === 0 && (
                            <div className="text-sm text-gray-500 italic">Keine Sessions ohne Rechnungsbeitrag</div>
                          )}
                        </div>
                      </div>

                      {/* Sessions mit Rechnungsbeitrag */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Bereits in Rechnung aufgeführt</h4>
                        <div className="space-y-2">
                          {suggestedSessions.filter(s => s.hasInvoiceItem).map((s) => {
                            const isInPool = poolSessionIds.has(s.id)
                            const isSelected = selectedSessionIds.has(s.id)
                            return (
                              <div 
                                key={s.id} 
                                draggable={!isInPool && canEdit && pool.status !== 'LOCKED'}
                                onDragStart={() => handleDragStart(s.id)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg ${isSelected ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'} border cursor-pointer hover:bg-gray-100 ${!isInPool && canEdit && pool.status !== 'LOCKED' ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                                onClick={() => setSelectedSessionForDetails(s)}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {canEdit && pool.status !== 'LOCKED' && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        toggleSessionSelection(s.id)
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{s.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(s.date) || 'ohne Datum'}
                                      {s.status ? ` • ${s.status === 'CLOSED' ? 'Beendet' : 'Offen'}` : ''}
                                    </p>
                                  </div>
                                </div>
                                {canEdit && pool.status !== 'LOCKED' && !isInPool && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addSessions([s.id])
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                          {suggestedSessions.filter(s => s.hasInvoiceItem).length === 0 && (
                            <div className="text-sm text-gray-500 italic">Keine Sessions mit Rechnungsbeitrag</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />

      {/* Session Details Modal */}
      {selectedSessionForDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedSessionForDetails(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedSessionForDetails.title}</h2>
                <button onClick={() => setSelectedSessionForDetails(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Datum:</span>
                  <span>{formatDate(selectedSessionForDetails.date) || 'ohne Datum'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>{selectedSessionForDetails.status === 'CLOSED' ? 'Beendet' : 'Offen'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teilnehmer:</span>
                  <span>{selectedSessionForDetails.participantCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Abgegebene Stimmen:</span>
                  <span>{selectedSessionForDetails.ballotCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Rechnung:</span>
                  <span>{selectedSessionForDetails.hasInvoiceItem ? 'Ja' : 'Nein'}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <Link href={`/results/${selectedSessionForDetails.id}`}>
                  <Button className="w-full bg-sky-500 hover:bg-sky-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ergebnisse anzeigen
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
