import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { checkRateLimit, rateLimitConfigs } from './rate-limit'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    async encode({ token, secret, maxAge }) {
      if (!token) return ''
      return jwt.sign(
        {
          id: (token as any).id,
          email: (token as any).email,
          sub: (token as any).id,
        },
        secret,
        {
          algorithm: 'HS256',
          expiresIn: maxAge,
        }
      )
    },
    async decode({ token, secret }) {
      if (!token) return null
      try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any
        return payload
      } catch {
        return null
      }
    },
  },
  providers: [
    // Google SSO (if configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    // Microsoft/Azure AD SSO (if configured)
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    // Apple SSO (required for App Store compliance)
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET ? [
      AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret: process.env.APPLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    // Credentials (email/password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Passwort', type: 'password' }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Normalize email for consistent lookup
          const normalizedEmail = credentials.email.toLowerCase().trim()

          // Rate limiting by email (since we don't have IP easily here)
          const rateLimit = checkRateLimit(normalizedEmail, 'login', rateLimitConfigs.login)
          if (!rateLimit.success) {
            throw new Error(`Zu viele Login-Versuche. Bitte warte ${rateLimit.resetIn} Sekunden.`)
          }

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          })

          if (!user || !user.password) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            return null
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse. Überprüfe deinen Posteingang.')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error: any) {
          // Re-throw custom errors so they show up in the frontend
          if (error?.message?.includes('E-Mail')) {
            throw error
          }
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For SSO providers, auto-create user if they don't exist
      if (account?.provider === 'google' || account?.provider === 'azure-ad' || account?.provider === 'apple') {
        if (user.email) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email.toLowerCase() }
            })
            
            if (!existingUser) {
              await prisma.user.create({
                data: {
                  email: user.email.toLowerCase(),
                  name: user.name || user.email.split('@')[0],
                  emailVerified: new Date(),
                  image: user.image,
                }
              })
            }
          } catch (error) {
            console.error('SSO user creation error:', error)
          }
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // On initial login, fetch the database user ID
      if (user) {
        // For SSO providers, we need to get the ID from our database, not the provider
        if (account?.provider === 'google' || account?.provider === 'azure-ad' || account?.provider === 'apple') {
          const email = (user.email || token.email || '').toLowerCase()
          const dbUser = email
            ? await prisma.user.findUnique({
                where: { email },
              })
            : null
          if (dbUser) {
            token.id = dbUser.id
          }
        } else {
          // For credentials, user.id is already from our database
          token.id = user.id
        }
        token.email = user.email
        ;(token as any).sub = token.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        if (token.email) {
          session.user.email = token.email as string
        } else if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { email: true },
          })
          if (dbUser?.email) {
            session.user.email = dbUser.email
          }
        }
      }
      return session
    }
  },
}
