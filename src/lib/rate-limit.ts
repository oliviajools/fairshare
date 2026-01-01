// Simple in-memory rate limiter
// Note: In production with multiple instances, use Redis instead

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Clean every minute

interface RateLimitOptions {
  windowMs?: number  // Time window in milliseconds
  maxAttempts?: number  // Max attempts per window
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number  // seconds until reset
}

export function checkRateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 60000, maxAttempts = 5 } = options
  const key = `${action}:${identifier}`
  const now = Date.now()

  const entry = rateLimitMap.get(key)

  // No existing entry or expired
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: maxAttempts - 1,
      resetIn: Math.ceil(windowMs / 1000)
    }
  }

  // Check if limit exceeded
  if (entry.count >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: maxAttempts - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000)
  }
}

// Preset configurations
export const rateLimitConfigs = {
  login: { windowMs: 60000, maxAttempts: 5 },      // 5 attempts per minute
  register: { windowMs: 3600000, maxAttempts: 3 }, // 3 registrations per hour per IP
  forgotPassword: { windowMs: 300000, maxAttempts: 3 }, // 3 requests per 5 minutes
}
