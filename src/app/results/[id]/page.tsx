'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Calendar, Eye, EyeOff, BarChart3, Calculator } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-6 py-8 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            
            <div className="flex flex-col gap-4">
              <div>
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
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-gray-900">
                            {result.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-sky-600">
                            {result.averagePercent.toFixed(1)}%
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({result.voteCount} Stimmen)
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-sky-500 h-3 rounded-full transition-all duration-500"
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
