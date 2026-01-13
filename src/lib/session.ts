import { cookies } from 'next/headers'
import { prisma } from './db'
import type { SessionUser } from './auth'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

type SessionData = {
  userId: string
  expiresAt: number
}

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function decodeSession(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8')
    const data = JSON.parse(json) as SessionData
    if (!data.userId || !data.expiresAt) {
      return null
    }
    return data
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const token = encodeSession({ userId, expiresAt })
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) {
    return null
  }
  
  const data = decodeSession(token)
  if (!data || data.expiresAt < Date.now()) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })
  
  return user
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden')
  }
  return session
}
