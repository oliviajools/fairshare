'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Save, Send, Calendar, Users, CheckCircle } from 'lucide-react'

interface Participant {
  id: string
  displayName: string
}

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  evaluationInfo?: string
  participants: Participant[]
}

interface Vote {
  personId: string
  percent: number
}

interface Ballot {
  id: string
  status: 'DRAFT' | 'SUBMITTED'
  votes: Vote[]
}

export default function VotePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [ballot, setBallot] = useState<Ballot | null>(null)
  const [votes, setVotes] = useState<{[personId: string]: number}>({})
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Calculate total percentage
  const totalPercentage = Object.values(votes).reduce((sum, percent) => sum + percent, 0)

  useEffect(() => {
    fetchVoteData()
  }, [token])

  const fetchVoteData = async () => {
    try {
      const response = await fetch(`/api/vote/${token}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
        setBallot(data.ballot)
        setIsSubmitted(data.ballot?.status === 'SUBMITTED')
        
        if (data.ballot?.votes) {
          const voteMap: {[personId: string]: number} = {}
          data.ballot.votes.forEach((vote: Vote) => {
            voteMap[vote.personId] = vote.percent
          })
          setVotes(voteMap)
        }
      } else if (response.status === 404) {
        setError('Ungültiger Einladungslink')
      } else if (response.status === 403) {
        setError('Diese Session ist bereits geschlossen')
      } else {
        setError('Fehler beim Laden der Session')
      }
    } catch (error) {
      console.error('Error fetching vote data:', error)
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const updateVote = (personId: string, percent: string) => {
    const numPercent = parseFloat(percent) || 0
    if (numPercent >= 0 && numPercent <= 100) {
      setVotes({ ...votes, [personId]: numPercent })
    }
  }

  const saveVotes = async () => {
    setSaving(true)
    try {
      const voteArray = Object.entries(votes)
        .filter(([_, percent]) => percent > 0)
        .map(([personId, percent]) => ({ personId, percent }))

      const response = await fetch(`/api/vote/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votes: voteArray
        }),
      })

      if (response.ok) {
        const updatedBallot = await response.json()
        setBallot(updatedBallot)
      } else {
        throw new Error('Failed to save votes')
      }
    } catch (error) {
      console.error('Error saving votes:', error)
      alert('Fehler beim Speichern. Bitte versuche es erneut.')
    } finally {
      setSaving(false)
    }
  }

  const submitVotes = async () => {
    // Validate 100% total before submitting
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Die Gesamtsumme muss genau 100% betragen. Aktuell: ${totalPercentage.toFixed(1)}%`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      // First save the current votes
      await saveVotes()
      
      // Then submit
      const response = await fetch(`/api/vote/${token}/submit`, {
        method: 'POST',
      })

      if (response.ok) {
        setIsSubmitted(true)
        // Check if session is now closed and redirect to results
        setTimeout(() => {
          fetchVoteData()
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Abgeben der Stimmen')
        return
      }
    } catch (error) {
      console.error('Error submitting votes:', error)
      alert('Fehler beim Absenden. Bitte versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalPercent = () => {
    return Object.values(votes).reduce((sum, percent) => sum + percent, 0)
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
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // If session is closed, show results or redirect
  if (session.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Session geschlossen
                </h2>
                <p className="text-gray-600 mb-4">
                  Die Bewertung für "{session.title}" ist abgeschlossen.
                </p>
                <Button
                  onClick={() => router.push(`/results/${session.id}`)}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  Ergebnisse anzeigen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {session.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              {session.date && (
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(session.date).toLocaleDateString('de-DE')}
                  {session.time && ` um ${session.time}`}
                </div>
              )}
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {session.participants.length} Teilnehmer
              </div>
            </div>
            
            {isSubmitted && (
              <div className="mt-4">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Abgestimmt
                </Badge>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Voting Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bewertung abgeben</CardTitle>
                  <CardDescription>
                    Gib für jede Person einen Prozentwert an (0-100%). Du musst nicht alle Felder ausfüllen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-4">
                        <Label className="w-1/3 text-sm font-medium">
                          {participant.displayName}
                        </Label>
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={votes[participant.id] || ''}
                            onChange={(e) => updateVote(participant.id, e.target.value)}
                            placeholder="0"
                            disabled={isSubmitted}
                            className="text-right"
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8">%</span>
                      </div>
                    ))}
                  </div>

                  {session.evaluationInfo && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-blue-800 font-medium">Wichtige Infos für die Bewertung</Label>
                      <p className="text-blue-700 mt-2 text-sm whitespace-pre-wrap">
                        {session.evaluationInfo}
                      </p>
                    </div>
                  )}

                  {/* Percentage Total Display */}
                  <div className="mt-6 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gesamtsumme:</span>
                      <span className={`text-lg font-bold ${
                        Math.abs(totalPercentage - 100) < 0.01 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {totalPercentage.toFixed(1)}%
                      </span>
                    </div>
                    {Math.abs(totalPercentage - 100) > 0.01 && (
                      <p className="text-sm text-red-600 mt-1">
                        Die Gesamtsumme muss genau 100% betragen
                      </p>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>* Fehlende Stimmen werden ignoriert</p>
                  </div>

                  {!isSubmitted && (
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={saveVotes}
                        disabled={saving}
                        className="flex-1"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Speichere...' : 'Zwischenspeichern'}
                      </Button>
                      <Button
                        onClick={submitVotes}
                        disabled={submitting || Object.keys(votes).length === 0 || Math.abs(totalPercentage - 100) > 0.01}
                        className="flex-1 bg-sky-500 hover:bg-sky-600"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submitting ? 'Sende...' : 'Abgeben'}
                      </Button>
                    </div>
                  )}

                  {/* Trust and Privacy Information */}
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700 text-center">
                      <strong>FairShare ist Vertrauen.</strong> Niemand sieht deine Angaben. 
                      Die Deepvelop-Geschäftsführung behält sich Stichproben vor.
                    </p>
                  </div>

                  {!isSubmitted && (
                    <p className="text-sm text-gray-600 mt-3">
                      Du kannst deine Angaben ändern, solange die Session offen ist.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Gesamt vergeben:</span>
                        <span className="font-medium">{getTotalPercent().toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(getTotalPercent(), 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Bewertete Personen:</strong> {Object.keys(votes).filter(id => votes[id] > 0).length}
                      </p>
                      <p>
                        <strong>Status:</strong> {isSubmitted ? 'Abgestimmt' : ballot?.status === 'DRAFT' ? 'Entwurf gespeichert' : 'Nicht gespeichert'}
                      </p>
                    </div>

                    {getTotalPercent() > 100 && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ Die Gesamtsumme überschreitet 100%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
