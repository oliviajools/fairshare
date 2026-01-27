'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const registered = searchParams.get('registered')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading')
  const [message, setMessage] = useState('')

  const verifyEmail = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Deine E-Mail wurde erfolgreich bestätigt!')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch {
      setStatus('error')
      setMessage('Verbindungsfehler')
    }
  }, [token, router])

  useEffect(() => {
    // Just registered - show pending verification message
    if (registered === 'true') {
      setStatus('pending')
      setMessage('Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link in der E-Mail, um deinen Account zu aktivieren.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Ungültiger Link')
      return
    }

    verifyEmail()
  }, [token, registered, verifyEmail])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-sky-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Überprüfe E-Mail...</h2>
              <p className="text-gray-600">Bitte warten</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">E-Mail bestätigt!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Du wirst gleich zum Login weitergeleitet...</p>
              <Link href="/login">
                <Button className="bg-sky-500 hover:bg-sky-600">
                  Jetzt einloggen
                </Button>
              </Link>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Fast geschafft!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Überprüfe auch deinen Spam-Ordner.</p>
              <Link href="/login">
                <Button variant="outline">
                  Zurück zum Login
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link href="/register">
                <Button className="bg-sky-500 hover:bg-sky-600">
                  Erneut registrieren
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
