import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface TokenPayload {
  sessionId: string
  participantId?: string
  type: 'vote' | 'organizer'
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateInviteToken(): string {
  return createHash('sha256').update(Math.random().toString()).digest('hex').substring(0, 32)
}
