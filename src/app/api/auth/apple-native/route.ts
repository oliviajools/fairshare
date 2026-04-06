import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { identityToken, email, fullName } = await request.json()

    if (!identityToken) {
      return NextResponse.json({ error: 'Identity token required' }, { status: 400 })
    }

    // Decode the Apple identity token (it's a JWT)
    const decoded = jwt.decode(identityToken) as {
      sub: string  // Apple user ID
      email?: string
      email_verified?: boolean
      aud: string
      iss: string
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid identity token' }, { status: 400 })
    }

    const appleUserId = decoded.sub

    const userEmail = email || decoded.email
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

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    })

    // Set the NextAuth session cookie
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = isProduction 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token'
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('Apple native auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
