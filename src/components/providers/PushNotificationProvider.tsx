'use client'

import { useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationProvider() {
  const { permissionStatus, requestPermission } = usePushNotifications()

  useEffect(() => {
    // Request permission on mount if not already granted/denied
    if (permissionStatus === 'prompt') {
      requestPermission()
    }
  }, [permissionStatus, requestPermission])

  return null // This component doesn't render anything
}
