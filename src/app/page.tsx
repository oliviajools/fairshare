'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Calendar, BarChart3, Trash2, Crown, Mail } from 'lucide-react'

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
  token: string
  sessionTitle: string
  participantName: string
  hasSubmitted: boolean
  addedAt: string
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [invitedSessions, setInvitedSessions] = useState<InvitedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'admin' | 'invited'>('admin')

  useEffect(() => {
    fetchSessions()
    loadInvitedSessions()
  }, [])

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

  const loadInvitedSessions = () => {
    try {
      const stored = localStorage.getItem('invitedSessions')
      if (stored) {
        setInvitedSessions(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading invited sessions:', error)
    }
  }

  const removeInvitedSession = (token: string) => {
    const updated = invitedSessions.filter(s => s.token !== token)
    setInvitedSessions(updated)
    localStorage.setItem('invitedSessions', JSON.stringify(updated))
  }

  const deleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Möchtest du die Session "${sessionTitle}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    setDeleting(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove session from local state
        setSessions(sessions.filter(s => s.id !== sessionId))
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              TeamPayer
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Der fairste Verteilungsschlüssel aller Zeiten
            </p>
            <Link href="/create">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600">
                <Plus className="mr-2 h-5 w-5" />
                Neue Session erstellen
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'admin' ? 'default' : 'outline'}
              onClick={() => setActiveTab('admin')}
              className={activeTab === 'admin' ? 'bg-sky-500 hover:bg-sky-600' : ''}
            >
              <Crown className="mr-2 h-4 w-4" />
              Meine Sessions
              {sessions.length > 0 && (
                <Badge variant="secondary" className="ml-2">{sessions.length}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'invited' ? 'default' : 'outline'}
              onClick={() => setActiveTab('invited')}
              className={activeTab === 'invited' ? 'bg-sky-500 hover:bg-sky-600' : ''}
            >
              <Mail className="mr-2 h-4 w-4" />
              Einladungen
              {invitedSessions.length > 0 && (
                <Badge variant="secondary" className="ml-2">{invitedSessions.length}</Badge>
              )}
            </Button>
          </div>

          {/* Admin Area - Meine Sessions */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Lade Sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Noch keine eigenen Sessions
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Erstelle deine erste Session, um mit der fairen Bewertung zu beginnen.
                    </p>
                    <Link href="/create">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Session erstellen
                      </Button>
                    </Link>
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
                            <Badge variant={session.status === 'OPEN' ? 'default' : 'secondary'}>
                              {session.status === 'OPEN' ? 'Offen' : 'Geschlossen'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSession(session.id, session.title)}
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
                        
                        {session.status === 'CLOSED' ? (
                          <Link href={`/results/${session.id}`}>
                            <Button variant="outline" className="w-full">
                              Ergebnisse anzeigen
                            </Button>
                          </Link>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Session läuft noch...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invited Area - Einladungen */}
          {activeTab === 'invited' && (
            <div className="space-y-6">
              {invitedSessions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Keine Einladungen
                    </h3>
                    <p className="text-gray-600">
                      Wenn du zu einer Session eingeladen wirst, erscheint sie hier.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {invitedSessions.map((invite) => (
                    <Card key={invite.token} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{invite.sessionTitle}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={invite.hasSubmitted ? 'secondary' : 'default'}>
                              {invite.hasSubmitted ? 'Abgestimmt' : 'Offen'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInvitedSession(invite.token)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          Du nimmst teil als: <strong>{invite.participantName}</strong>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href={`/vote/${invite.token}`}>
                          <Button 
                            variant={invite.hasSubmitted ? 'outline' : 'default'}
                            className={!invite.hasSubmitted ? 'w-full bg-sky-500 hover:bg-sky-600' : 'w-full'}
                          >
                            {invite.hasSubmitted ? 'Abstimmung ansehen' : 'Jetzt abstimmen'}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
