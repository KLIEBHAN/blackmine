#!/usr/bin/env npx tsx
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { webcrypto } from 'node:crypto'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:dev.db',
})
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const key = await webcrypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hashBuffer = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/set-password.ts <email> <password>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`Password updated for ${email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
