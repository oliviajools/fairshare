'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Calendar, Eye, EyeOff, BarChart3, Calculator, Trash2, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PieChart } from '@/components/PieChart'
import { ShareResults } from '@/components/ShareResults'

interface Participant {
  id: string
  displayName: string
}

interface Vote {
  personId: string
  percent: number
}

interface Ballot {
  id: string
  participantId: string | null
  participant: Participant | null
  status: string
  votes: Vote[]
}

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  isAnonymous: boolean
  evaluationInfo?: string
  creatorId?: string
  participants: Participant[]
  ballots: Ballot[]
}

interface ResultData {
  participantId: string
  name: string
  totalPercent: number
  voteCount: number
  averagePercent: number
  voters?: string[]
  isFixedShare?: boolean
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { data: authSession } = useSession()
  
  const [session, setSession] = useState<Session | null>(null)
  const [results, setResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const isCreator = session?.creatorId && authSession?.user && session.creatorId === (authSession.user as any).id

  useEffect(() => {
    if (sessionId) {
      fetchResults()
    }
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/results`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      setSession(data.session)
      setResults(data.results)
    } catch (err) {
      setError('Fehler beim Laden der Ergebnisse')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeParticipant = async (participantId: string, participantName: string) => {
    const confirmed = window.confirm(
      `Möchtest du "${participantName}" wirklich entfernen?\n\n` +
      `Alle Stimmen von und für diese Person werden gelöscht. ` +
      `Die Prozente der anderen werden auf 100% hochgerechnet.\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden.`
    )
    
    if (!confirmed) return

    setRemoving(participantId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants/${participantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh results to get updated percentages
        await fetchResults()
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
    if (!newParticipantName.trim()) return

    setAdding(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newParticipantName.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh results to include new participant
        await fetchResults()
        setNewParticipantName('')
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Ergebnisse...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Session nicht gefunden'}</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedResults = [...results].sort((a, b) => b.averagePercent - a.averagePercent)

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 page-transition">
      <div className="container mx-auto px-6 py-8 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.back()}
                  className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{session.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-600 text-sm">
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
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {isCreator && session.status === 'CLOSED' && (
                  <Link href={`/results/${sessionId}/payout`}>
                    <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
                      <Calculator className="mr-2 h-4 w-4" />
                      Auszahlung
                    </Button>
                  </Link>
                )}
                <Badge variant={session.status === 'CLOSED' ? 'default' : 'secondary'}>
                  {session.status === 'CLOSED' ? 'Abgeschlossen' : 'Offen'}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {session.isAnonymous ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Anonym
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Nicht anonym
                    </>
                  )}
                </Badge>
                {isCreator && session.status === 'CLOSED' && sortedResults.length > 0 && (
                  <ShareResults
                    targetRef={resultsRef}
                    sessionTitle={session.title}
                    results={sortedResults}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Shareable Results Area */}
          <div ref={resultsRef} className="bg-gradient-to-br from-sky-50 to-amber-50 p-4 rounded-lg">
          {/* Pie Chart */}
          {sortedResults.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center">Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <PieChart
                    data={sortedResults.map(r => ({
                      name: r.name,
                      value: Math.round(r.averagePercent * 10) / 10
                    }))}
                    size={220}
                    showLabels={true}
                    showLegend={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Ergebnisse
              </CardTitle>
              <CardDescription>
                Durchschnittliche Bewertung pro Teilnehmer
                {session.isAnonymous && (
                  <span className="block mt-1 text-amber-600">
                    Diese Session ist anonym - Abstimmungsdetails werden nicht angezeigt.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedResults.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Noch keine Abstimmungen vorhanden.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedResults.map((result, index) => (
                    <div 
                      key={result.participantId} 
                      className={`p-4 rounded-lg ${result.isFixedShare ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {result.isFixedShare ? (
                            <span className="text-xl font-bold text-amber-500">⚡</span>
                          ) : (
                            <span className="text-2xl font-bold text-gray-400">
                              #{index + 1}
                            </span>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">
                              {result.name}
                            </span>
                            {result.isFixedShare && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Fester Anteil
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${result.isFixedShare ? 'text-amber-600' : 'text-sky-600'}`}>
                              {result.averagePercent.toFixed(1)}%
                            </span>
                            {!result.isFixedShare && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({result.voteCount} Stimmen)
                              </span>
                            )}
                          </div>
                          {isCreator && !result.isFixedShare && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(result.participantId, result.name)}
                              disabled={removing === result.participantId}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                              title="Teilnehmer entfernen"
                            >
                              {removing === result.participantId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${result.isFixedShare ? 'bg-amber-500' : 'bg-sky-500'}`}
                          style={{ width: `${Math.min(result.averagePercent, 100)}%` }}
                        />
                      </div>

                      {/* Show voters if not anonymous */}
                      {!session.isAnonymous && result.voters && result.voters.length > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Abgestimmt von: </span>
                          {result.voters.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Participant Section - only for creator */}
              {isCreator && (
                <div className="mt-6 pt-6 border-t">
                  {showAddForm ? (
                    <div className="p-4 border-2 border-dashed border-sky-200 rounded-lg bg-sky-50/50">
                      <h4 className="font-medium mb-3">Neuen Teilnehmer hinzufügen</h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={newParticipantName}
                          onChange={(e) => setNewParticipantName(e.target.value)}
                          className="bg-white flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                        />
                        <Button
                          onClick={addParticipant}
                          disabled={adding || !newParticipantName.trim()}
                          className="bg-sky-500 hover:bg-sky-600"
                        >
                          {adding ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddForm(false)
                            setNewParticipantName('')
                          }}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(true)}
                      className="w-full text-sky-600 border-sky-200 hover:bg-sky-50"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Teilnehmer hinzufügen
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluation Info */}
          {session.evaluationInfo && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Bewertungshinweise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{session.evaluationInfo}</p>
              </CardContent>
            </Card>
          )}
          </div>{/* End shareable area */}
        </div>
      </div>
    </div>
  )
}
