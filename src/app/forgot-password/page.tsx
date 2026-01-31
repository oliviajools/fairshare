'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">E-Mail gesendet!</h2>
            <p className="text-gray-600 mb-6">
              Falls ein Account mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Überprüfe auch deinen Spam-Ordner.
            </p>
            <Link href="/login" className="flex justify-center">
              <button className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-sky-600" />
          </div>
          <CardTitle className="text-2xl">Passwort vergessen?</CardTitle>
          <CardDescription>
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-sky-500 hover:bg-sky-600"
            >
              {loading ? 'Sende...' : 'Reset-Link senden'}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <Link href="/login">
              <button className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
