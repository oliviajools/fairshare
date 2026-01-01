'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { Mail, Calendar } from 'lucide-react'

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

export default function InvitationsPage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [invitations, setInvitations] = useState<InvitedSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchInvitations()
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
  const closedInvitations = invitations.filter(i => i.sessionStatus === 'CLOSED')

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-bold text-gray-900">Einladungen</h1>
            </div>
            <p className="text-gray-600">Sessions zu denen du eingeladen wurdest</p>
          </div>

          {/* Invitations List */}
          {invitations.length === 0 ? (
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
                            <Badge variant={invite.hasSubmitted ? 'secondary' : 'default'}>
                              {invite.hasSubmitted ? 'Abgestimmt' : 'Offen'}
                            </Badge>
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

              {/* Closed Invitations */}
              {closedInvitations.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Beendet ({closedInvitations.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {closedInvitations.map((invite) => (
                      <Card key={invite.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-gray-600">{invite.sessionTitle}</CardTitle>
                            <Badge variant="secondary">Beendet</Badge>
                          </div>
                          <CardDescription>
                            Von {invite.creatorName}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
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
