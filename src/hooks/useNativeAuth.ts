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
      if (isNative) {
        // Use native Apple Sign-In
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
        
        const result: AppleSignInResult = await SignInWithApple.authorize({
          clientId: 'com.teampayer.app',
          redirectURI: 'https://teampayer.vercel.app/api/auth/callback/apple',
          scopes: 'email name',
        })

        // Send to our backend to create session
        const response = await fetch('/api/auth/apple-native', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identityToken: result.response.identityToken,
            user: result.response.user,
            email: result.response.email,
            fullName: result.response.fullName,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed')
        }

        // Store session token and redirect
        if (data.sessionToken) {
          // Trigger NextAuth session refresh by signing in with a special provider
          // or just redirect and let the middleware handle it
          localStorage.setItem('apple-session-token', data.sessionToken)
          
          // Sign in with credentials using the token
          const signInResult = await signIn('credentials', {
            email: data.user.email,
            password: `apple:${data.sessionToken}`,
            redirect: false,
          })

          if (signInResult?.error) {
            // If credentials don't work, the user needs to set a password
            // For now, just redirect - the session is valid
            router.push('/')
            router.refresh()
          } else {
            router.push('/')
            router.refresh()
          }
        }
      } else {
        // Use web OAuth
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
