'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { Mail, Calendar, ArrowLeft, EyeOff, Eye, ChevronDown, ChevronUp } from 'lucide-react'

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

interface HiddenSession {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  creatorName: string
  hiddenAt: string
}

export default function InvitationsPage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [invitations, setInvitations] = useState<InvitedSession[]>([])
  const [hiddenSessions, setHiddenSessions] = useState<HiddenSession[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hiding, setHiding] = useState<string | null>(null)
  const [unhiding, setUnhiding] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchInvitations()
      fetchHiddenSessions()
    }
  }, [authStatus, router])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHiddenSessions = async () => {
    try {
      const response = await fetch('/api/sessions/hidden')
      if (response.ok) {
        const data = await response.json()
        setHiddenSessions(data)
      }
    } catch (error) {
      console.error('Error fetching hidden sessions:', error)
    }
  }

  const hideInvitation = async (sessionId: string) => {
    setHiding(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/hide`, {
        method: 'POST',
      })
      if (response.ok) {
        const hiddenInvite = invitations.find(i => i.sessionId === sessionId)
        setInvitations(invitations.filter(i => i.sessionId !== sessionId))
        if (hiddenInvite) {
          setHiddenSessions([...hiddenSessions, {
            id: hiddenInvite.sessionId,
            title: hiddenInvite.sessionTitle,
            date: hiddenInvite.sessionDate,
            time: hiddenInvite.sessionTime,
            status: hiddenInvite.sessionStatus,
            creatorName: hiddenInvite.creatorName,
            hiddenAt: new Date().toISOString()
          }])
        }
      }
    } catch (error) {
      console.error('Error hiding invitation:', error)
    } finally {
      setHiding(null)
    }
  }

  const unhideSession = async (sessionId: string) => {
    setUnhiding(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/hide`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setHiddenSessions(hiddenSessions.filter(s => s.id !== sessionId))
        // Refresh invitations to show the unhidden one
        fetchInvitations()
      }
    } catch (error) {
      console.error('Error unhiding session:', error)
    } finally {
      setUnhiding(null)
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

  const openInvitations = invitations.filter(i => i.sessionStatus === 'OPEN')

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Mail className="h-8 w-8 text-sky-500 flex-shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Einladungen</h1>
              <p className="text-gray-600">Sessions zu denen du eingeladen wurdest</p>
            </div>
          </div>

          {/* Invitations List */}
          {openInvitations.length === 0 && hiddenSessions.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-16">
                <span className="text-6xl mb-6 block">📬</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Keine Einladungen
                </h3>
                <p className="text-gray-600">
                  Wenn dich jemand zu einer Session einlädt, erscheint sie hier.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Open Invitations */}
              {openInvitations.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Offen ({openInvitations.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {openInvitations.map((invite) => (
                      <Card key={invite.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
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
                                onClick={() => hideInvitation(invite.sessionId)}
                                disabled={hiding === invite.sessionId}
                                className="text-gray-400 hover:text-gray-600"
                                title="Einladung ausblenden"
                              >
                                {hiding === invite.sessionId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            Von <strong>{invite.creatorName}</strong> • Du als: {invite.participantName}
                          </CardDescription>
                          {invite.sessionDate && (
                            <CardDescription className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(invite.sessionDate)}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <Link href={`/vote/${invite.inviteToken}`}>
                            <Button 
                              className={invite.hasSubmitted ? 'w-full' : 'w-full bg-sky-500 hover:bg-sky-600'}
                              variant={invite.hasSubmitted ? 'outline' : 'default'}
                            >
                              {invite.hasSubmitted ? 'Abstimmung ansehen' : 'Jetzt abstimmen'}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Sessions */}
              {hiddenSessions.length > 0 && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowHidden(!showHidden)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                  >
                    {showHidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <EyeOff className="h-4 w-4" />
                    Ausgeblendet ({hiddenSessions.length})
                  </button>
                  
                  {showHidden && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {hiddenSessions.map((session) => (
                        <Card key={session.id} className="opacity-60 hover:opacity-100 transition-opacity">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-gray-600">{session.title}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unhideSession(session.id)}
                                disabled={unhiding === session.id}
                                className="text-sky-500 hover:text-sky-600"
                                title="Wieder einblenden"
                              >
                                {unhiding === session.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <CardDescription>
                              Von {session.creatorName}
                            </CardDescription>
                            {session.date && (
                              <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.date)}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
