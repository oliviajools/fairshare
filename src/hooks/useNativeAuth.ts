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
      // Robust iOS native detection - log everything for debugging
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      const isNative = Capacitor.isNativePlatform?.() ?? false
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const uaIsIOS = /iPhone|iPad|iPod/.test(ua)

      console.log('[AppleAuth] platform:', platform, 'isNative:', isNative, 'UA iOS:', uaIsIOS, 'UA:', ua)

      // Only use native flow when truly running in a Capacitor native app
      const isIOSNative = platform === 'ios' || isNative

      let SignInWithApple: any = null
      if (isIOSNative) {
        try {
          const mod = await import('@capacitor-community/apple-sign-in')
          SignInWithApple = mod.SignInWithApple
        } catch (e) {
          console.log('[AppleAuth] native plugin not available:', e)
        }
      }

      if (SignInWithApple) {
        console.log('[AppleAuth] Calling SignInWithApple.authorize()...')

        const result: AppleSignInResult = await SignInWithApple.authorize({
          clientId: appleClientId,
          scopes: 'email name',
        })

        console.log('[AppleAuth] Raw result:', JSON.stringify(result, null, 2))
        console.log('[AppleAuth] identityToken exists:', !!result?.response?.identityToken)
        console.log('[AppleAuth] user exists:', !!result?.response?.user)
        console.log('[AppleAuth] email exists:', !!result?.response?.email)

        // Validate we have at least identityToken or user
        if (!result?.response?.identityToken && !result?.response?.user) {
          throw new Error('Apple Sign-In lieferte keine gültigen Anmeldedaten')
        }

        // Send to our backend to create session
        const endpoint = `${apiBaseUrl}/api/auth/apple-native`
        console.log('[AppleAuth] POST ->', endpoint)

        const requestBody = {
          identityToken: result.response.identityToken,
          user: result.response.user,
          email: result.response.email,
          fullName: result.response.fullName,
        }
        console.log('[AppleAuth] Request body:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        })

        console.log('[AppleAuth] Response status:', response.status)

        let data: any = null
        const responseText = await response.text()
        console.log('[AppleAuth] Raw response:', responseText)

        try {
          data = responseText ? JSON.parse(responseText) : null
        } catch (e) {
          console.error('[AppleAuth] Failed to parse response as JSON:', e)
          data = null
        }

        if (!response.ok || !data?.success) {
          const msg = data?.error || `Apple-Anmeldung fehlgeschlagen (${response.status})`
          throw new Error(msg)
        }

        console.log('[AppleAuth] Success! Storing token and navigating...')

        // Store token in localStorage for native apps
        if (data.token) {
          localStorage.setItem('next-auth.session-token', data.token)
          console.log('[AppleAuth] Token stored in localStorage')
        } else {
          console.warn('[AppleAuth] No token in response!')
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
