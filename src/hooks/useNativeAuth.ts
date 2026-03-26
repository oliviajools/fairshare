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
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || 'https://teampayer.vercel.app/api/auth/callback/apple'

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
      // Always try native first when on iOS
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      
      if (platform === 'ios') {
        // Use native Apple Sign-In
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
        
        const result: AppleSignInResult = await SignInWithApple.authorize({
          clientId: appleClientId,
          redirectURI: appleRedirectUri,
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

        // Session cookie is set by the API, just redirect
        if (data.success) {
          router.push('/')
          router.refresh()
        }
      } else if (platform === 'web') {
        // Use web OAuth
        await signIn('apple', { callbackUrl: '/' })
      } else {
        throw new Error('Apple Sign-In is only available on iOS and web')
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
