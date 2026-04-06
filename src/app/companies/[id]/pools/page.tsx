'use client'

import { useCallback, useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { ArrowLeft, Plus, Layers, Lock } from 'lucide-react'

type PoolStatus = 'DRAFT' | 'LOCKED'

type PoolListItem = {
  id: string
  name: string
  status: PoolStatus
  sessionCount: number
  createdAt: string
  updatedAt: string
  createdBy?: string
}

type PoolsResponse = {
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  pools: PoolListItem[]
}

export default function CompanyPoolsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = use(params)
  const router = useRouter()
  const { status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null)
  const [pools, setPools] = useState<PoolListItem[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const canCreate = useMemo(() => role === 'OWNER' || role === 'ADMIN', [role])

  const fetchPools = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/companies/${companyId}/pools`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Fehler beim Laden der Pools')
      }
      const data: PoolsResponse = await res.json()
      setRole(data.role)
      setPools(data.pools)
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Pools')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchPools()
    }
  }, [status, companyId, router, fetchPools])

  const createPool = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Fehler beim Erstellen')
      }

      setShowCreate(false)
      setNewName('')
      await fetchPools()
    } catch (e: any) {
      alert(e?.message || 'Fehler beim Erstellen')
    } finally {
      setCreating(false)
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push(`/companies/${companyId}`)}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Layers className="h-8 w-8 text-sky-500 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pools</h1>
              <p className="text-gray-600">Sessions bündeln (z.B. quartalsweise) und zusammenfassen</p>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="py-4 text-red-700">{error}</CardContent>
            </Card>
          )}

          {canCreate && !showCreate && (
            <Button onClick={() => setShowCreate(true)} className="mb-6 bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Neuen Pool erstellen
            </Button>
          )}

          {canCreate && showCreate && (
            <Card className="mb-6 border-sky-200">
              <CardHeader>
                <CardTitle>Neuer Pool</CardTitle>
                <CardDescription>z.B. „Q1 2026 – Projekt X“</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Pool-Name" />
                <div className="flex gap-2">
                  <Button
                    onClick={createPool}
                    disabled={creating || !newName.trim()}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    {creating ? 'Erstellen...' : 'Erstellen'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreate(false)
                      setNewName('')
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {pools.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-16">
                <span className="text-5xl mb-4 block">🧾</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Noch keine Pools</h3>
                <p className="text-gray-600">Erstelle einen Pool, um Sessions für Abrechnung/Projekte zusammenzufassen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pools.map((p) => (
                <Link key={p.id} href={`/companies/${companyId}/pools/${p.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                        <Badge variant={p.status === 'LOCKED' ? 'secondary' : 'default'} className="flex items-center gap-1">
                          {p.status === 'LOCKED' ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Gesperrt
                            </>
                          ) : (
                            'Entwurf'
                          )}
                        </Badge>
                      </div>
                      <CardDescription>
                        {p.sessionCount} Session{p.sessionCount !== 1 ? 's' : ''}
                        {p.createdBy ? ` • erstellt von ${p.createdBy}` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Zuletzt geändert: {new Date(p.updatedAt).toLocaleDateString('de-DE')}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
