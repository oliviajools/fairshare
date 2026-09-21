import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { prisma } from '@/lib/db'

type SessionInvitation = {
  email?: string
  token: string
}

export async function sendSessionInvitationNotifications(
  title: string,
  invitations: SessionInvitation[]
) {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    return
  }

  const invitationsByEmail = new Map(
    invitations
      .filter((invitation) => invitation.email?.trim())
      .map((invitation) => [invitation.email!.trim().toLowerCase(), invitation])
  )

  if (invitationsByEmail.size === 0) {
    return
  }

  const users = await prisma.user.findMany({
    where: { email: { in: [...invitationsByEmail.keys()], mode: 'insensitive' } },
    select: {
      email: true,
      deviceTokens: {
        where: { isActive: true },
        select: { token: true },
      },
    },
  })

  const messages = users.flatMap((user) => {
    const invitation = invitationsByEmail.get(user.email.toLowerCase())
    if (!invitation) return []

    return user.deviceTokens.map((device) => ({
      token: device.token,
      notification: {
        title: 'Neue TeamPayer-Einladung',
        body: `Du wurdest zur Session „${title}“ eingeladen.`,
      },
      data: {
        sessionTitle: title,
        inviteToken: invitation.token,
        path: `/vote/${invitation.token}`,
      },
      android: { notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    }))
  })

  if (messages.length === 0) {
    return
  }

  const app = getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      })
    : getApps()[0]
  const messaging = getMessaging(app)
  const invalidTokens: string[] = []

  for (let index = 0; index < messages.length; index += 500) {
    const batch = messages.slice(index, index + 500)
    const response = await messaging.sendEach(batch)
    response.responses.forEach((result, responseIndex) => {
      if (!result.success && result.error?.code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(batch[responseIndex].token)
      }
    })
  }

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { isActive: false },
    })
  }
}
