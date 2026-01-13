/**
 * Auth utilities for password hashing and session management.
 * Uses Web Crypto API (no external dependencies).
 */

import { prisma } from './db'
import type { User } from '@/generated/prisma/client'

// Constants
const SALT_LENGTH = 16
const HASH_ITERATIONS = 100000
const HASH_LENGTH = 32

/**
 * Hash a password using PBKDF2 with a random salt.
 * Format: salt:hash (both hex-encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_LENGTH * 8
  )

  const hashArray = new Uint8Array(hashBuffer)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')

  return `${saltHex}:${hashHex}`
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) {
    return false
  }

  const [saltHex, expectedHashHex] = storedHash.split(':')
  if (!saltHex || !expectedHashHex) {
    return false
  }

  // Reconstruct salt from hex
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) ?? []
  )

  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_LENGTH * 8
  )

  const hashArray = new Uint8Array(hashBuffer)
  const actualHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')

  // Timing-safe comparison
  return actualHashHex === expectedHashHex
}

/**
 * Authenticate user by email and password.
 * Returns user (without passwordHash) or null.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!user || !user.passwordHash) {
    // User doesn't exist or has no password set
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  // Return user without password hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Session user type (user data stored in session, no sensitive fields)
 */
export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

/**
 * Convert full user to session user (strips sensitive data)
 */
export function toSessionUser(user: Omit<User, 'passwordHash'>): SessionUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }
}
