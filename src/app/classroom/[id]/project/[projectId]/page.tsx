'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNav } from '@/components/BottomNav'
import {
  ArrowLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Calculator
} from 'lucide-react'

interface Grade {
  participantId: string
  name: string
  averagePercent: number
  points: number
  grade: string
}

interface GradeData {
  graded: boolean
  teacherPoints: number
  participantCount: number
  totalPoints: number
  grades: Grade[]
}

export default function ProjectGradePage({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id, projectId } = use(params)
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [teacherPoints, setTeacherPoints] = useState<string>('')
  const [displayMode, setDisplayMode] = useState<'points' | 'grade'>('points')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProject()
      fetchGrades()
    }
  }, [status, id, projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/classrooms/${id}/projects`)
      if (response.ok) {
        const projects = await response.json()
        const found = projects.find((p: any) => p.id === projectId)
        if (found) setProject(found)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/classrooms/${id}/projects/${projectId}/grade`)
      if (response.ok) {
        const data = await response.json()
        if (data.graded) {
          setGradeData(data)
          setTeacherPoints(data.teacherPoints.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const submitGrade = async () => {
    const points = parseInt(teacherPoints)
    if (isNaN(points) || points < 0 || points > 15) {
      setError('Bitte gib eine Punktzahl zwischen 0 und 15 ein')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/classrooms/${id}/projects/${projectId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points })
      })

      if (response.ok) {
        const data = await response.json()
        setGradeData({
          graded: true,
          teacherPoints: data.teacherPoints,
          participantCount: data.participantCount,
          totalPoints: data.totalPoints,
          grades: data.grades
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error submitting grade:', error)
      setError('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-gray-600">Projekt nicht gefunden</p>
          <Link href={`/classroom/${id}`}>
            <Button className="mt-4">Zurück zur Klasse</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isClosed = project.session?.status === 'CLOSED'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/classroom/${id}`)}
                className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <GraduationCap className="h-8 w-8 text-sky-500 flex-shrink-0" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {isClosed ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Abgeschlossen
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Abstimmung läuft
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isClosed ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Abstimmung noch nicht abgeschlossen</h3>
                <p className="text-gray-500">
                  Du kannst die Punktevergabe erst starten, wenn alle Schüler abgestimmt haben.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grade Input */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-600" />
                    Projekt bewerten
                  </CardTitle>
                  <CardDescription>
                    Gib die Gesamtpunktzahl für das Projekt ein (0-15 Punkte)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="points">Projektpunktzahl</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="points"
                          type="number"
                          min="0"
                          max="15"
                          value={teacherPoints}
                          onChange={(e) => setTeacherPoints(e.target.value)}
                          placeholder="z.B. 13"
                          className="w-24 text-center text-lg font-bold"
                        />
                        <span className="text-gray-500">Punkte</span>
                        {gradeData && (
                          <span className="text-sm text-gray-400 ml-2">
                            × {gradeData.participantCount} Schüler = {gradeData.totalPoints} Gesamtpunkte
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={submitGrade} disabled={saving}>
                        <Calculator className="mr-2 h-4 w-4" />
                        {saving ? 'Berechne...' : gradeData ? 'Neu berechnen' : 'Berechnen'}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                </CardContent>
              </Card>

              {/* Results Table */}
              {gradeData && gradeData.grades.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-indigo-600" />
                          Individuelle Noten
                        </CardTitle>
                        <CardDescription>
                          Basierend auf der prozentualen Bewertung der Mitschüler
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setDisplayMode('points')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            displayMode === 'points'
                              ? 'bg-white shadow text-indigo-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Punkte
                        </button>
                        <button
                          onClick={() => setDisplayMode('grade')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            displayMode === 'grade'
                              ? 'bg-white shadow text-indigo-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Note
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Schüler</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-600">Anteil</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-600">
                              {displayMode === 'points' ? 'Punkte' : 'Note'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradeData.grades.map((grade, index) => (
                            <tr key={grade.participantId} className="border-b last:border-0">
                              <td className="py-3 px-4">
                                <span className="font-medium">{grade.name}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-gray-600">{grade.averagePercent}%</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full text-lg font-bold ${
                                  grade.points >= 13 ? 'bg-green-100 text-green-700' :
                                  grade.points >= 10 ? 'bg-emerald-100 text-emerald-700' :
                                  grade.points >= 7 ? 'bg-yellow-100 text-yellow-700' :
                                  grade.points >= 4 ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {displayMode === 'points' ? grade.points : grade.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Berechnungsgrundlage</h4>
                      <p className="text-sm text-gray-600">
                        Projektpunktzahl ({gradeData.teacherPoints}) × Anzahl Schüler ({gradeData.participantCount}) = {gradeData.totalPoints} Gesamtpunkte
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Diese Gesamtpunkte werden entsprechend der prozentualen Bewertung auf die Schüler verteilt.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
