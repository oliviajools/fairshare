'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

interface AppleSignInResult {
  response: {
    identityToken: string
    email?: string | null
    fullName?: {
      givenName?: string | null
      familyName?: string | null
    } | null
    user: string | null
  }
}

export function useNativeAuth() {
  const router = useRouter()
  const [isNative, setIsNative] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'com.teampayer.app'
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || 'https://teampayer.de/api/auth/callback/apple'
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://teampayer.de'

  useEffect(() => {
    // Check if running in Capacitor
    const checkNative = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        setIsNative(Capacitor.isNativePlatform())
      } catch {
        setIsNative(false)
      }
    }
    checkNative()
  }, [])

  const signInWithApple = async () => {
    setLoading(true)
    setError('')

    try {
      // Robust iOS native detection
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      const isIOSNative =
        platform === 'ios' ||
        (Capacitor.isNativePlatform?.() && /iPhone|iPad|iPod/.test(navigator.userAgent))

      if (isIOSNative) {
        // ALWAYS use native Apple Sign-In on iOS - never fall back to web
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')

        const result: AppleSignInResult = await SignInWithApple.authorize({
          clientId: appleClientId,
          scopes: 'email name',
        })

        // Send to our backend to create session
        const endpoint = `${apiBaseUrl}/api/auth/apple-native`
        console.log('Apple native auth -> POST', endpoint)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            identityToken: result.response.identityToken,
            user: result.response.user,
            email: result.response.email,
            fullName: result.response.fullName,
          }),
        })

        console.log('Apple native auth <- status', response.status)

        let data: any = null
        try {
          data = await response.json()
        } catch {
          data = null
        }

        if (!response.ok || !data?.success) {
          const msg = data?.error || `Apple-Anmeldung fehlgeschlagen (${response.status})`
          throw new Error(msg)
        }

        // Store token in localStorage for native apps
        if (data.token) {
          localStorage.setItem('next-auth.session-token', data.token)
        }
        // Navigate to home page
        router.push('/')
        router.refresh()
      } else {
        // Web flow only outside iOS native app
        await signIn('apple', { callbackUrl: '/' })
      }
    } catch (err: any) {
      console.error('Apple Sign-In error:', err)
      if (err.message?.includes('canceled') || err.message?.includes('cancelled')) {
        setError('Anmeldung abgebrochen')
      } else {
        setError(err.message || 'Apple-Anmeldung fehlgeschlagen')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    isNative,
    loading,
    error,
    signInWithApple,
    clearError: () => setError(''),
  }
}
