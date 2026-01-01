import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { checkRateLimit, rateLimitConfigs } from './rate-limit'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
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

          // Rate limiting by email (since we don't have IP easily here)
          const rateLimit = checkRateLimit(credentials.email, 'login', rateLimitConfigs.login)
          if (!rateLimit.success) {
            throw new Error(`Zu viele Login-Versuche. Bitte warte ${rateLimit.resetIn} Sekunden.`)
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    }
  },
}
