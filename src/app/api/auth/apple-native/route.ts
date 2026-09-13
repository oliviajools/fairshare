import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { identityToken, user: appleUserIdFromRequest, email, fullName } = await request.json()

    console.log('Apple native auth request received:', {
      hasIdentityToken: !!identityToken,
      hasAppleUserId: !!appleUserIdFromRequest,
      hasEmail: !!email,
      hasFullName: !!fullName,
      email: email || 'not provided'
    })

    let appleUserId: string | null = null
    let decodedToken: { sub?: string; email?: string; email_verified?: boolean } | null = null

    // Try to decode identity token first
    if (identityToken) {
      try {
        decodedToken = jwt.decode(identityToken) as {
          sub: string
          email?: string
          email_verified?: boolean
          aud: string
          iss: string
        }

        console.log('Apple token decoded:', {
          hasSub: !!decodedToken?.sub,
          hasEmail: !!decodedToken?.email,
          emailVerified: decodedToken?.email_verified,
          aud: (decodedToken as any)?.aud,
          iss: (decodedToken as any)?.iss
        })

        if (decodedToken?.sub) {
          appleUserId = decodedToken.sub
        }
      } catch (e) {
        console.error('Failed to decode identity token:', e)
      }
    }

    // Fallback to user ID from request if token decoding failed
    if (!appleUserId && appleUserIdFromRequest) {
      appleUserId = appleUserIdFromRequest
      console.log('Using Apple User ID from request:', appleUserId)
    }

    if (!appleUserId) {
      console.error('Apple native auth: No Apple User ID available (neither from token nor request)')
      return NextResponse.json({ error: 'Apple User ID required' }, { status: 400 })
    }

    const userEmail = email || decodedToken?.email
    const userName = fullName?.givenName && fullName?.familyName
      ? `${fullName.givenName} ${fullName.familyName}`
      : fullName?.givenName || userEmail?.split('@')[0] || 'Apple User'

    let dbUser = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: 'apple',
            providerAccountId: appleUserId,
          }
        }
      }
    })

    if (!dbUser) {
      if (!userEmail) {
        return NextResponse.json(
          { error: 'Email required on first Apple sign-in. Please retry and allow email sharing once.' },
          { status: 400 }
        )
      }

      const normalizedEmail = userEmail.toLowerCase().trim()

      dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      })

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: userName,
            emailVerified: new Date(),
            accounts: {
              create: {
                type: 'oauth',
                provider: 'apple',
                providerAccountId: appleUserId,
              }
            }
          }
        })
      } else {
        await prisma.account.create({
          data: {
            userId: dbUser.id,
            type: 'oauth',
            provider: 'apple',
            providerAccountId: appleUserId,
          }
        })
      }
    }

    if (!dbUser.name && userName) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { name: userName }
      })
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET not configured' }, { status: 500 })
    }

    const sessionToken = jwt.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        sub: dbUser.id,
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: 30 * 24 * 60 * 60,
      }
    )

    // Create response with session token
    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    })

    // Set the NextAuth session cookie so useSession() picks it up
    const isProd = process.env.NODE_ENV === 'production'
    const cookieName = isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Apple native auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
