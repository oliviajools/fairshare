'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { Archive, Calendar, Users, BarChart3, Trash2, ArrowLeft } from 'lucide-react'

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  organizerToken?: string
  _count: {
    participants: number
    ballots: number
  }
}

export default function ArchivePage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchSessions()
    }
  }, [authStatus, router])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        // Filter only closed sessions
        setSessions(data.filter((s: Session) => s.status === 'CLOSED'))
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Möchtest du "${sessionTitle}" wirklich löschen?`)) return

    setDeleting(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!authSession?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Archive className="h-8 w-8 text-sky-500" />
                <h1 className="text-3xl font-bold text-gray-900">Archiv</h1>
              </div>
              <p className="text-gray-600">Deine abgeschlossenen Sessions</p>
            </div>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-16">
                <span className="text-6xl mb-6 block">📦</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Noch nichts im Archiv
                </h3>
                <p className="text-gray-600">
                  Beendete Sessions landen automatisch hier.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Beendet</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSession(session.id, session.title)}
                          disabled={deleting === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {session.date && (
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(session.date)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {session._count.participants} Teilnehmer
                      </span>
                      <span>{session._count.ballots}/{session._count.participants} abgestimmt</span>
                    </div>
                    <Link href={`/results/${session.id}`}>
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Ergebnisse ansehen
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
