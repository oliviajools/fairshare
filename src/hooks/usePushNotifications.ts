import { useEffect, useState, useCallback } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useSession } from 'next-auth/react'
import { Capacitor } from '@capacitor/core'

export function usePushNotifications() {
  const { data: session } = useSession()
  const [isRegistered, setIsRegistered] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  const requestPermission = useCallback(async () => {
    const platform = Capacitor.getPlatform()
    if (platform !== 'ios' && platform !== 'android') {
      console.log('Push notifications only available on mobile platforms')
      return false
    }

    try {
      const result = await PushNotifications.requestPermissions()
      const granted = result.receive === 'granted'

      if (granted) {
        setPermissionStatus('granted')
        // Register for push notifications
        await PushNotifications.register()
      } else {
        setPermissionStatus('denied')
      }

      return granted
    } catch (error) {
      console.error('Error requesting push notification permission:', error)
      return false
    }
  }, [])

  const registerToken = useCallback(async () => {
    if (!session?.user?.email || !Capacitor.isNativePlatform()) {
      return
    }

    try {
      const result = await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value)

        // Send token to server
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
        const response = await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token.value,
            platform,
          }),
        })

        if (response.ok) {
          setIsRegistered(true)
          console.log('Device token registered with server')
        } else {
          console.error('Failed to register device token with server')
        }
      })

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Registration error:', error.error)
      })

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification)
        // Show local notification
        LocalNotifications.schedule({
          notifications: [
            {
              title: notification.title || 'TeamPayer',
              body: notification.body || 'Neue Benachrichtigung',
              id: Date.now(),
              schedule: { at: new Date() },
              sound: 'default',
            },
          ],
        })
      })

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue)
        // Handle notification tap - navigate to relevant page
        if (notification.notification?.data?.sessionId) {
          window.location.href = `/results/${notification.notification.data.sessionId}`
        }
      })
    } catch (error) {
      console.error('Error setting up push notification listeners:', error)
    }
  }, [session])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    // Setup local notifications
    LocalNotifications.requestPermissions().then((result) => {
      console.log('Local notifications permission:', result)
    })

    // Check current permission status
    PushNotifications.checkPermissions().then((result) => {
      if (result.receive === 'granted') {
        setPermissionStatus('granted')
        PushNotifications.register()
      } else if (result.receive === 'denied') {
        setPermissionStatus('denied')
      }
    })

    // Register token if session exists
    if (session?.user?.email) {
      registerToken()
    }
  }, [session, registerToken])

  return {
    isRegistered,
    permissionStatus,
    requestPermission,
  }
}
