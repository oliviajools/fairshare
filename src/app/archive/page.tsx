'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/BottomNav'
import { Archive, Calendar, Users, BarChart3, Trash2, ArrowLeft, CheckCircle2, Clock } from 'lucide-react'

interface Session {
  id: string
  title: string
  date?: string
  time?: string
  status: 'OPEN' | 'CLOSED'
  organizerToken?: string
  createdAt?: string
  creatorId?: string
  creator?: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    participants: number
    ballots: number
  }
}

const CARD_COLORS = [
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-teal-600',
]

export default function ArchivePage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchSessions()
    }
  }, [authStatus, router])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.filter((s: Session) => s.status === 'CLOSED'))
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Möchtest du "${sessionTitle}" wirklich löschen?`)) return

    setDeleting(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Gestern'
    if (diffDays < 7) return `vor ${diffDays} Tagen`
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`
    return formatDate(dateString)
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!authSession?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Archive className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Archiv</h1>
                <p className="text-gray-500">{sessions.length} abgeschlossene Sessions</p>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Archive className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Noch nichts im Archiv
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Beendete Sessions landen automatisch hier, sobald du sie abschließt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const colorClass = CARD_COLORS[index % CARD_COLORS.length]
                const completionRate = session._count.participants > 0 
                  ? Math.round((session._count.ballots / session._count.participants) * 100) 
                  : 0
                
                return (
                  <div 
                    key={session.id} 
                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Color accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${colorClass}`} />
                    
                    <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                              {session.title}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Beendet
                            </span>
                            {session.creatorId !== (authSession.user as any)?.id && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 w-fit">
                                Teilnehmer
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                            {session.date && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(session.date)}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              {session._count.participants} Teilnehmer
                            </span>
                            {session.createdAt && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {getTimeAgo(session.createdAt)}
                              </span>
                            )}
                          </div>

                          {/* Completion bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Beteiligung</span>
                              <span className="font-medium text-gray-700">{completionRate}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions - Desktop: right side, Mobile: below content */}
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <Link href={`/results/${session.id}`} className="flex-1 sm:flex-none">
                            <Button 
                              size="sm"
                              className={`w-full sm:w-auto bg-gradient-to-r ${colorClass} hover:opacity-90 text-white shadow-md`}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Ergebnisse
                            </Button>
                          </Link>
                          {session.creatorId === (authSession.user as any)?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSession(session.id, session.title)}
                              disabled={deleting === session.id}
                              className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
