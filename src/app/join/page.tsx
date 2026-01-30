'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function JoinClassroomPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ classroomName: string; alreadyJoined: boolean } | null>(null)
  const [formData, setFormData] = useState({
    joinCode: '',
    studentName: '',
    studentEmail: ''
  })

  // Pre-fill from session
  useState(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        studentName: (session.user as any).name || '',
        studentEmail: (session.user as any).email || ''
      }))
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Beitritt fehlgeschlagen')
        return
      }

      setSuccess({
        classroomName: data.classroom.name,
        alreadyJoined: data.alreadyJoined
      })
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Klasse beitreten</CardTitle>
          <CardDescription className="text-base">
            Gib den Beitrittscode ein, den du von deinem Lehrer erhalten hast
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {success.alreadyJoined ? 'Du bist bereits dabei!' : 'Erfolgreich beigetreten!'}
              </h3>
              <p className="text-gray-500 mb-6">
                Du bist jetzt Teil von <strong>{success.classroomName}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Dein Lehrer wird dir Abstimmungslinks für Projektbewertungen senden.
              </p>
              <Link href="/">
                <Button>
                  Zur Startseite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="joinCode">Beitrittscode</Label>
                <Input
                  id="joinCode"
                  placeholder="z.B. ABC123"
                  className="text-center font-mono text-lg tracking-wider uppercase"
                  maxLength={6}
                  value={formData.joinCode}
                  onChange={(e) => setFormData({ ...formData, joinCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentName">Dein Name</Label>
                <Input
                  id="studentName"
                  placeholder="Vor- und Nachname"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentEmail">E-Mail (optional)</Label>
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="deine@email.de"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Damit du Abstimmungslinks per E-Mail erhalten kannst
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90"
                disabled={loading}
              >
                {loading ? 'Beitreten...' : 'Klasse beitreten'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/" className="text-indigo-600 hover:underline">
              Zurück zur Startseite
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
