'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Calendar, CheckCircle, Clock, Lock, Eye, Mail, Copy, Check, Trash2, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Participant {
  id: string
  displayName: string
  invitedEmail?: string
  inviteToken?: string
  hasSubmitted: boolean
}

interface Session {
  id: string
  title: string
  date: string
  status: 'OPEN' | 'CLOSED'
  participants: Participant[]
  _count: {
    ballots: number
  }
}

export default function OrganizerPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  const [closing, setClosing] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantEmail, setNewParticipantEmail] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchSession()
    
    // Auto-refresh every 10 seconds if session is open
    const interval = setInterval(() => {
      if (session?.status === 'OPEN') {
        fetchSession()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [token])

  const fetchSession = async () => {
    try {
      // For now, we'll extract sessionId from token on the server side
      // In a real implementation, this would be handled by an API endpoint
      const response = await fetch(`/api/organizer/${token}`)
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
      } else if (response.status === 404) {
        setError('Session nicht gefunden')
      } else if (response.status === 403) {
        setError('Ungültiger Organisator-Link')
      } else {
        setError('Fehler beim Laden der Session')
      }
    } catch (error) {
      console.error('Error fetching session:', error)
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const closeSession = async () => {
    if (!session) return
    
    const confirmed = window.confirm(
      'Möchtest du die Session wirklich schließen? Nach dem Schließen können keine weiteren Bewertungen abgegeben werden.'
    )
    
    if (!confirmed) return

    setClosing(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const updatedSession = await response.json()
        setSession({ ...session, status: updatedSession.status })
        
        // Redirect to results after a short delay
        setTimeout(() => {
          router.push(`/results/${session.id}`)
        }, 2000)
      } else {
        throw new Error('Failed to close session')
      }
    } catch (error) {
      console.error('Error closing session:', error)
      alert('Fehler beim Schließen der Session. Bitte versuche es erneut.')
    } finally {
      setClosing(false)
    }
  }

  const getSubmissionProgress = () => {
    if (!session) return { submitted: 0, total: 0, percentage: 0 }
    
    const submitted = session.participants.filter(p => p.hasSubmitted).length
    const total = session.participants.length
    const percentage = total > 0 ? (submitted / total) * 100 : 0
    
    return { submitted, total, percentage }
  }

  const getVoteLink = (inviteToken: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/vote/${inviteToken}`
  }

  const copyLink = async (inviteToken: string) => {
    try {
      await navigator.clipboard.writeText(getVoteLink(inviteToken))
      setCopiedToken(inviteToken)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const sendEmail = (participant: Participant) => {
    if (!participant.inviteToken || !session) return
    
    const voteLink = getVoteLink(participant.inviteToken)
    const subject = encodeURIComponent(`Einladung: ${session.title}`)
    const body = encodeURIComponent(
      `Hallo ${participant.displayName},\n\n` +
      `Du wurdest zur Session "${session.title}" eingeladen.\n\n` +
      `Klicke auf folgenden Link, um deine Bewertung abzugeben:\n${voteLink}\n\n` +
      `Viele Grüße`
    )
    
    window.location.href = `mailto:${participant.invitedEmail || ''}?subject=${subject}&body=${body}`
  }

  const removeParticipant = async (participantId: string, participantName: string) => {
    if (!session) return
    
    const confirmed = window.confirm(
      `Möchtest du "${participantName}" wirklich entfernen?\n\n` +
      `Alle Stimmen von und für diese Person werden gelöscht. ` +
      `Die Prozente der anderen werden entsprechend angepasst.\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden.`
    )
    
    if (!confirmed) return

    setRemoving(participantId)
    try {
      const response = await fetch(`/api/sessions/${session.id}/participants/${participantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local state
        setSession({
          ...session,
          participants: session.participants.filter(p => p.id !== participantId)
        })
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Entfernen des Teilnehmers')
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      alert('Fehler beim Entfernen des Teilnehmers')
    } finally {
      setRemoving(null)
    }
  }

  const addParticipant = async () => {
    if (!session || !newParticipantName.trim()) return

    setAdding(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newParticipantName.trim(),
          email: newParticipantEmail.trim() || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state with new participant
        setSession({
          ...session,
          participants: [...session.participants, data.participant]
        })
        setNewParticipantName('')
        setNewParticipantEmail('')
        setShowAddForm(false)
      } else {
        alert(data.error || 'Fehler beim Hinzufügen des Teilnehmers')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Fehler beim Hinzufügen des Teilnehmers')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const progress = getSubmissionProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-6 py-8 pt-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <Card className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                      {session.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        {new Date(session.date).toLocaleDateString('de-DE')}
                      </div>
                      <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
                        <Users className="mr-1.5 h-4 w-4" />
                        {session.participants.length} Teilnehmer
                      </div>
                      <Badge 
                        variant={session.status === 'OPEN' ? 'default' : 'secondary'}
                        className="px-3 py-1.5"
                      >
                        {session.status === 'OPEN' ? (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Offen
                          </>
                        ) : (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Geschlossen
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {session.status === 'CLOSED' && (
                    <Link href={`/results/${session.id}`}>
                      <Button className="bg-sky-500 hover:bg-sky-600">
                        <Eye className="mr-2 h-4 w-4" />
                        Ergebnisse anzeigen
                      </Button>
                    </Link>
                  )}
                  
                  {session.status === 'OPEN' && (
                    <Button
                      onClick={closeSession}
                      disabled={closing}
                      variant="destructive"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {closing ? 'Schließe...' : 'Session schließen'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Fortschritt</CardTitle>
                <CardDescription>
                  Übersicht über eingegangene Bewertungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Abgegebene Bewertungen
                    </span>
                    <span className="text-sm text-gray-600">
                      {progress.submitted} von {progress.total}
                    </span>
                  </div>
                  
                  <Progress value={progress.percentage} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{progress.submitted}</div>
                      <div className="text-sm text-gray-600">Abgestimmt</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {progress.total - progress.submitted}
                      </div>
                      <div className="text-sm text-gray-600">Ausstehend</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-sky-600">
                        {progress.percentage.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Vollständig</div>
                    </div>
                  </div>

                  {progress.percentage === 100 && session.status === 'OPEN' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-green-800 font-medium">
                          Alle Teilnehmer haben abgestimmt!
                        </span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Du kannst die Session jetzt schließen, um die Ergebnisse zu veröffentlichen.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Teilnehmer</CardTitle>
                  <CardDescription>
                    Status der einzelnen Teilnehmer
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-sky-600 border-sky-200 hover:bg-sky-50"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                {/* Add Participant Form */}
                {showAddForm && (
                  <div className="mb-4 p-4 border-2 border-dashed border-sky-200 rounded-lg bg-sky-50/50">
                    <h4 className="font-medium mb-3">Neuen Teilnehmer hinzufügen</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="Name *"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        className="bg-white"
                      />
                      <Input
                        placeholder="E-Mail (optional)"
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={addParticipant}
                          disabled={adding || !newParticipantName.trim()}
                          className="bg-sky-500 hover:bg-sky-600"
                        >
                          {adding ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          Hinzufügen
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddForm(false)
                            setNewParticipantName('')
                            setNewParticipantEmail('')
                          }}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {session.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{participant.displayName}</h4>
                        {participant.invitedEmail && (
                          <p className="text-sm text-gray-600 truncate">{participant.invitedEmail}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {participant.inviteToken && session.status === 'OPEN' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLink(participant.inviteToken!)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Link kopieren"
                            >
                              {copiedToken === participant.inviteToken ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendEmail(participant)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Per E-Mail einladen"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Badge variant={participant.hasSubmitted ? 'default' : 'secondary'}>
                          {participant.hasSubmitted ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Abgestimmt
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              Ausstehend
                            </>
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(participant.id, participant.displayName)}
                          disabled={removing === participant.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Teilnehmer entfernen"
                        >
                          {removing === participant.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Session-Einstellungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Bewertungsmodus:</span>
                    <p className="text-gray-600">
                      Anonyme Gruppenbewertung
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-gray-600">
                      {session.status === 'OPEN' ? 'Session ist offen für Bewertungen' : 'Session ist geschlossen'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
