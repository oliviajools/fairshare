'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Calendar, BarChart3, Trash2, Crown, Settings, LogOut, EyeOff, X } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  _count: {
    participants: number
    ballots: number
  }
}

interface InvitedSession {
  id: string
  sessionId: string
  sessionTitle: string
  sessionDate?: string
  sessionTime?: string
  sessionStatus: 'OPEN' | 'CLOSED'
  creatorName: string
  participantName: string
  inviteToken: string
  hasSubmitted: boolean
}

interface CreatedSession {
  organizerLink: string
  title: string
  createdAt: string
}

export default function Home() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [invitedSessions, setInvitedSessions] = useState<InvitedSession[]>([])
  const [createdSessions, setCreatedSessions] = useState<{[id: string]: CreatedSession}>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{sessionId: string, title: string} | null>(null)

  // Redirect to onboarding or login if not authenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      const onboardingComplete = localStorage.getItem('onboardingComplete')
      if (!onboardingComplete) {
        router.push('/onboarding')
      } else {
        router.push('/login')
      }
    }
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchSessions()
      loadInvitedSessions()
      loadCreatedSessions()
    }
  }, [authStatus])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitedSessions = async () => {
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitedSessions(data)
      }
    } catch (error) {
      console.error('Error loading invited sessions:', error)
    }
  }

  const loadCreatedSessions = () => {
    try {
      const stored = localStorage.getItem('createdSessions')
      if (stored) {
        setCreatedSessions(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading created sessions:', error)
    }
  }

  const getOrganizerLink = (sessionId: string): string | null => {
    return createdSessions[sessionId]?.organizerLink || null
  }

  const removeInvitedSession = (inviteToken: string) => {
    const updated = invitedSessions.filter(s => s.inviteToken !== inviteToken)
    setInvitedSessions(updated)
  }

  const openDeleteDialog = (sessionId: string, title: string) => {
    setDeleteDialog({ sessionId, title })
  }

  const deleteSessionForAll = async () => {
    if (!deleteDialog) return
    
    setDeleting(deleteDialog.sessionId)
    try {
      const response = await fetch(`/api/sessions/${deleteDialog.sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== deleteDialog.sessionId))
        setDeleteDialog(null)
      } else {
        alert('Fehler beim Löschen der Session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Fehler beim Löschen der Session')
    } finally {
      setDeleting(null)
    }
  }

  const hideSessionForMe = async () => {
    if (!deleteDialog) return
    
    setDeleting(deleteDialog.sessionId)
    try {
      const response = await fetch(`/api/sessions/${deleteDialog.sessionId}/hide`, {
        method: 'POST',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== deleteDialog.sessionId))
        setDeleteDialog(null)
      } else {
        alert('Fehler beim Ausblenden der Session')
      }
    } catch (error) {
      console.error('Error hiding session:', error)
      alert('Fehler beim Ausblenden der Session')
    } finally {
      setDeleting(null)
    }
  }

  // Show loading while checking auth
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!authSession?.user) {
    return null
  }

  const userName = authSession.user.name || authSession.user.email?.split('@')[0] || 'TeamPayer'

  // Filter only open sessions for home page
  const openSessions = sessions.filter(s => s.status === 'OPEN')

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            {/* Greeting */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Hallo, {userName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Hier wird Kohle fair verteilt.
              </p>
            </div>

            <Link href="/create">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600 w-full sm:w-auto shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Neue Session erstellen
              </Button>
            </Link>
          </div>

          {/* Section Header */}
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-gray-900">Aktive Sessions</h2>
            {openSessions.length > 0 && (
              <Badge variant="secondary">{openSessions.length}</Badge>
            )}
          </div>

          {/* Sessions List */}
          <div className="space-y-6">
            {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Lade Sessions...</p>
                </div>
              ) : openSessions.length === 0 ? (
                <Card className="border-2 border-dashed border-sky-200 bg-gradient-to-br from-sky-50/50 to-amber-50/50">
                  <CardContent className="text-center py-16 px-8">
                    <div className="mb-6">
                      <span className="text-6xl">🚀</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Bereit für faire Verteilung?
                    </h3>
                    <p className="text-gray-600 mb-2 text-lg">
                      Noch keine Sessions erstellt – aber das ändern wir jetzt!
                    </p>
                    <p className="text-gray-500 mb-6 text-sm italic">
                      Tipp: Je mehr Leute abstimmen, desto fairer wird's. Mathe-Magie! ✨
                    </p>
                    <Link href="/create">
                      <Button size="lg" className="bg-sky-500 hover:bg-sky-600 shadow-lg hover:shadow-xl transition-all">
                        <Plus className="mr-2 h-5 w-5" />
                        Erste Session starten
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {openSessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={session.status === 'OPEN' ? 'default' : 'secondary'}>
                              {session.status === 'OPEN' ? 'Offen' : 'Geschlossen'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(session.id, session.title)}
                              disabled={deleting === session.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleting === session.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          {session.date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-1 h-4 w-4" />
                              {new Date(session.date).toLocaleDateString('de-DE')}
                              {session.time && ` um ${session.time}`}
                            </div>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4" />
                            {session._count.participants} Teilnehmer
                          </div>
                          <div>
                            {session._count.ballots}/{session._count.participants} abgestimmt
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {session.status === 'CLOSED' ? (
                            <Link href={`/results/${session.id}`}>
                              <Button variant="outline" className="w-full">
                                Ergebnisse anzeigen
                              </Button>
                            </Link>
                          ) : (
                            <div className="text-xs text-gray-500 mb-2">
                              Session läuft noch...
                            </div>
                          )}
                          {getOrganizerLink(session.id) && (
                            <Link href={getOrganizerLink(session.id)!}>
                              <Button variant="outline" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                Verwalten
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
      <BottomNav />

      {/* Delete Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Session entfernen</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setDeleteDialog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Was möchtest du mit "{deleteDialog.title}" tun?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={hideSessionForMe}
                disabled={!!deleting}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Nur für mich ausblenden
              </Button>
              <p className="text-xs text-gray-500 ml-6">
                Die Session bleibt für andere Teilnehmer sichtbar
              </p>
              
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={deleteSessionForAll}
                disabled={!!deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Für alle löschen
              </Button>
              <p className="text-xs text-gray-500 ml-6">
                Die Session wird komplett gelöscht (nicht rückgängig)
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
