'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'

const hiddenPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/onboarding',
  '/site',
]

export function AppBottomNav() {
  const pathname = usePathname()
  const isHidden = hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (isHidden) return null

  return <BottomNav />
}
