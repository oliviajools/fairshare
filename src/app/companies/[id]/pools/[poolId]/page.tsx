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

  const [results, setResults] = useState<AggregatedResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)

  const [year, setYear] = useState<number>(() => {
    const y = searchParams.get('year')
    const parsed = y ? parseInt(y, 10) : NaN
    return Number.isFinite(parsed) ? parsed : new Date().getFullYear()
  })
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const q = searchParams.get('q')
    const parsed = q ? parseInt(q, 10) : NaN
    if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) return parsed
    return 1
  })

  const canEdit = useMemo(() => role === 'OWNER' || role === 'ADMIN', [role])

  const selectedRange = useMemo(() => quarterRange(year, quarter), [year, quarter])

  const poolSessionIds = useMemo(() => new Set((pool?.sessions || []).map((ps) => ps.sessionId)), [pool?.sessions])

  const suggestedSessions = useMemo(() => {
    const { start, end } = selectedRange
    const inRange = companySessions.filter((s) => {
      if (!s.date) return false
      const d = new Date(s.date)
      return d >= start && d <= end
    })
    return inRange
  }, [companySessions, selectedRange])

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
      setCompanySessions(data.sessions)
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

              <Card>
                <CardHeader>
                  <CardTitle>Sessions im Pool</CardTitle>
                  <CardDescription>Aktuell enthaltene Sessions</CardDescription>
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
                  <CardTitle>Quartal auswählen</CardTitle>
                  <CardDescription>Sessions im Zeitraum werden vorgeschlagen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Jahr</label>
                      <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value || `${new Date().getFullYear()}`, 10))}
                        min={2000}
                        max={2100}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Quartal</label>
                      <select
                        value={quarter}
                        onChange={(e) => setQuarter(parseInt(e.target.value, 10) as any)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Zeitraum: {selectedRange.start.toLocaleDateString('de-DE')} – {selectedRange.end.toLocaleDateString('de-DE')}
                  </div>

                  {canEdit ? (
                    <Button
                      className="w-full bg-sky-500 hover:bg-sky-600"
                      disabled={pool.status === 'LOCKED'}
                      onClick={handleAddSuggested}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Alle Sessions dieses Quartals hinzufügen
                    </Button>
                  ) : (
                    <div className="text-sm text-gray-600">Du hast keine Berechtigung, den Pool zu bearbeiten.</div>
                  )}

                  <div className="text-xs text-gray-500">Hinweis: Es werden Sessions anhand ihres `date`-Felds gefiltert.</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vorschläge (Sessions im Quartal)</CardTitle>
                  <CardDescription>
                    {loadingCompany ? 'Lädt…' : `${suggestedSessions.length} Session${suggestedSessions.length !== 1 ? 's' : ''} im Zeitraum`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestedSessions.length === 0 ? (
                    <div className="text-sm text-gray-600">Keine Sessions mit Datum in diesem Quartal gefunden.</div>
                  ) : (
                    <div className="space-y-2">
                      {suggestedSessions.map((s) => {
                        const isInPool = poolSessionIds.has(s.id)
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-100">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{s.title}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(s.date)}
                                {s.status ? ` • ${s.status === 'CLOSED' ? 'Beendet' : 'Offen'}` : ''}
                              </p>
                            </div>
                            {canEdit && pool.status !== 'LOCKED' && (
                              <Button
                                variant={isInPool ? 'outline' : 'default'}
                                size="sm"
                                className={isInPool ? '' : 'bg-sky-500 hover:bg-sky-600'}
                                onClick={async () => {
                                  try {
                                    if (isInPool) {
                                      await removeSessions([s.id])
                                    } else {
                                      await addSessions([s.id])
                                    }
                                  } catch (e: any) {
                                    alert(e?.message || 'Fehler')
                                  }
                                }}
                              >
                                {isInPool ? (
                                  <>
                                    <Minus className="h-4 w-4 mr-2" />
                                    Entfernen
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Hinzufügen
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
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
