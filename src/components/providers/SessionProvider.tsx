'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Check if running in Capacitor (native app)
    const checkNative = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          // For native apps, ensure the localStorage token is set as a cookie
          // so NextAuth can use it
          const token = localStorage.getItem('next-auth.session-token')
          if (token) {
            document.cookie = `next-auth.session-token=${token}; path=/; max-age=2592000; SameSite=Lax`
          }
        }
      } catch {
        // Not running in Capacitor, ignore
      }
    }
    checkNative()
  }, [mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
