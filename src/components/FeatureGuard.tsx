'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasFeature } from '@/lib/app-mode'

interface FeatureGuardProps {
  feature: 'voting' | 'classroom' | 'join-classroom'
  children: React.ReactNode
  fallbackUrl?: string
}

export function FeatureGuard({ feature, children, fallbackUrl = '/' }: FeatureGuardProps) {
  const router = useRouter()
  const allowed = hasFeature(feature)

  useEffect(() => {
    if (!allowed) {
      router.replace(fallbackUrl)
    }
  }, [allowed, router, fallbackUrl])

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Weiterleitung...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
