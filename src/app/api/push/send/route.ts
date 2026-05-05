import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Firebase Admin SDK
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging, Message } from 'firebase-admin/messaging'

// Initialize Firebase Admin lazily (only when needed)
function getMessagingClient() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase environment variables not configured')
  }

  const firebaseConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  }

  const adminApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return getMessaging(adminApp)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Only allow admins to send push notifications
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, title, body: messageBody, data } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds ist erforderlich' }, { status: 400 })
    }

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'title und body sind erforderlich' }, { status: 400 })
    }

    // Get device tokens for the specified users
    let deviceTokens: any[] = []
    try {
      deviceTokens = await (prisma as any).deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
        select: { token: true, platform: true },
      })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'DeviceToken Tabelle existiert noch nicht. Bitte Migration durchführen.' },
          { status: 503 }
        )
      }
      throw error
    }

    if (deviceTokens.length === 0) {
      return NextResponse.json({ success: true, message: 'Keine aktiven Device Tokens gefunden' })
    }

    // Send push notifications via FCM
    const tokens = deviceTokens.map((dt) => dt.token)
    const response = await getMessagingClient().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body: messageBody,
      },
      data: data || {},
    })

    // Handle invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = []
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx])
        }
      })

      // Deactivate invalid tokens
      if (invalidTokens.length > 0) {
        try {
          await (prisma as any).deviceToken.updateMany({
            where: { token: { in: invalidTokens } },
            data: { isActive: false },
          })
        } catch (error) {
          // Ignore errors during token cleanup
          console.error('Error deactivating invalid tokens:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json({ error: 'Fehler beim Senden der Push-Benachrichtigung' }, { status: 500 })
  }
}
