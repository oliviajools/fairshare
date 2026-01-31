'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BottomNav } from '@/components/BottomNav'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Repeat, 
  Trash2, 
  Play, 
  Pause,
  RefreshCw,
  CalendarDays
} from 'lucide-react'

interface RecurringSession {
  id: string
  title: string
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'
  dayOfWeek?: number
  dayOfMonth?: number
  time?: string
  isActive: boolean
  nextRunAt?: string
  lastRunAt?: string
  _count: { sessions: number }
  createdAt: string
}

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Wöchentlich',
  BIWEEKLY: 'Alle 2 Wochen',
  MONTHLY: 'Monatlich',
  QUARTERLY: 'Vierteljährlich'
}

const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export default function RecurringSessionsPage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const [sessions, setSessions] = useState<RecurringSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'
    dayOfWeek: number
    dayOfMonth: number
    time: string
    isAnonymous: boolean
  }>({
    title: '',
    frequency: 'MONTHLY',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    isAnonymous: true
  })

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchSessions()
    }
  }, [authStatus, router])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/recurring')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching recurring sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newSession = await response.json()
        setSessions([newSession, ...sessions])
        setShowForm(false)
        setFormData({
          title: '',
          frequency: 'MONTHLY',
          dayOfWeek: 1,
          dayOfMonth: 1,
          time: '09:00',
          isAnonymous: true
        })
      }
    } catch (error) {
      console.error('Error creating recurring session:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        setSessions(sessions.map(s => 
          s.id === id ? { ...s, isActive: !isActive } : s
        ))
      }
    } catch (error) {
      console.error('Error toggling recurring session:', error)
    }
  }

  const deleteSession = async (id: string, title: string) => {
    if (!confirm(`"${title}" wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting recurring session:', error)
    }
  }

  const formatNextRun = (dateString?: string) => {
    if (!dateString) return 'Nicht geplant'
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (!authSession?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Repeat className="h-8 w-8 text-sky-500 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wiederkehrende Sessions</h1>
                  <p className="text-gray-500">Automatisch erstellte Sessions</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-emerald-500 to-green-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Neu
              </Button>
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-6 border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Neue wiederkehrende Session</CardTitle>
                <CardDescription>Diese Session wird automatisch erstellt</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="z.B. Monatliches Teamevent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Häufigkeit</Label>
                      <select
                        id="frequency"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="WEEKLY">Wöchentlich</option>
                        <option value="BIWEEKLY">Alle 2 Wochen</option>
                        <option value="MONTHLY">Monatlich</option>
                        <option value="QUARTERLY">Vierteljährlich</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Uhrzeit</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  {(formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY') && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfWeek">Wochentag</Label>
                      <select
                        id="dayOfWeek"
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        {DAYS.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(formData.frequency === 'MONTHLY' || formData.frequency === 'QUARTERLY') && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfMonth">Tag des Monats</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min={1}
                        max={28}
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="anonymous" className="font-medium">Anonyme Abstimmung</Label>
                      <p className="text-sm text-gray-500">Teilnehmer sehen nicht, wer wie abgestimmt hat</p>
                    </div>
                    <Switch
                      id="anonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={saving || !formData.title} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600">
                      {saving ? 'Speichern...' : 'Erstellen'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Keine wiederkehrenden Sessions
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Erstelle automatisch wiederholende Sessions für regelmäßige Team-Events.
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-500 to-green-600">
                <Plus className="mr-2 h-4 w-4" />
                Erste Session erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className={`transition-all ${session.isActive ? 'border-emerald-200' : 'opacity-60'}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{session.title}</h3>
                          {session.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <Play className="h-3 w-3" />
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <Pause className="h-3 w-3" />
                              Pausiert
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Repeat className="h-4 w-4" />
                            {FREQUENCY_LABELS[session.frequency]}
                          </span>
                          {session.time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {session.time} Uhr
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="h-4 w-4" />
                            {session._count.sessions} erstellt
                          </span>
                        </div>

                        {session.nextRunAt && session.isActive && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Nächste Session:</span>{' '}
                            <span className="text-emerald-600 font-medium">{formatNextRun(session.nextRunAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(session.id, session.isActive)}
                          className={session.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {session.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSession(session.id, session.title)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
