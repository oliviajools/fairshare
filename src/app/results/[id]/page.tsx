'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Calendar, Users, Trophy, FileText, KeyRound } from 'lucide-react'

interface Result {
  participantId: string
  displayName: string
  meanPercent: number
  numRatings: number
  totalSubmissions: number
}

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  evaluationInfo?: string
}

interface ResultsData {
  session: Session
  results: Result[]
  totalSubmissions: number
}

export default function ResultsPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ResultsData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResults()
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/results`)
      if (response.ok) {
        const resultsData = await response.json()
        setData(resultsData)
      } else if (response.status === 404) {
        setError('Session nicht gefunden')
      } else if (response.status === 403) {
        setError('Session ist noch nicht geschlossen')
      } else {
        setError('Fehler beim Laden der Ergebnisse')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const headers = ['Rang', 'Name', 'Durchschnitt (%)', 'Bewertungen', 'Von Teilnehmern']
    const rows = data.results.map((result, index) => [
      index + 1,
      result.displayName,
      result.meanPercent.toFixed(2),
      result.numRatings,
      result.totalSubmissions
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `teampayer-${data.session.title}-ergebnisse.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getMaxPercent = () => {
    if (!data || data.results.length === 0) return 0
    return Math.max(...data.results.map(r => r.meanPercent))
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 2:
        return <Trophy className="h-5 w-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">#{index + 1}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Ergebnisse...</p>
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

  if (!data) {
    return null
  }

  const maxPercent = getMaxPercent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Ergebnisse: {data.session.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                  {data.session.date && (
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {new Date(data.session.date).toLocaleDateString('de-DE')}
                      {data.session.time && ` um ${data.session.time}`}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {data.totalSubmissions} Bewertungen
                  </div>
                  <Badge variant="secondary">
                    Fehlende ignoriert
                  </Badge>
                </div>
              </div>
              
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                CSV Export
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bewertungsergebnisse</CardTitle>
                <CardDescription>
                  Sortiert nach durchschnittlicher Bewertung (absteigend)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.results.map((result, index) => (
                    <div key={result.participantId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <KeyRound className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg">{result.displayName}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-sky-600">
                            {result.meanPercent.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            bewertet von {result.numRatings}/{result.totalSubmissions}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={(result.meanPercent / maxPercent) * 100} 
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Anteil am Gesamtergebnis</span>
                          <span>{((result.meanPercent / maxPercent) * 100).toFixed(1)}% der Höchstbewertung</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Info */}
            {data.session.evaluationInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Wichtige Infos für die Bewertung
                  </CardTitle>
                  <CardDescription>
                    Vom Organisator bereitgestellte Bewertungshinweise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-700 text-sm whitespace-pre-wrap">
                      {data.session.evaluationInfo}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-sky-600">{data.results.length}</div>
                    <div className="text-sm text-gray-600">Bewertete Personen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-sky-600">{data.totalSubmissions}</div>
                    <div className="text-sm text-gray-600">Abgegebene Stimmen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-sky-600">
                      {maxPercent.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Höchste Bewertung</div>
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
