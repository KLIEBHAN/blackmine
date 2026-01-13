'use server'

import { redirect } from 'next/navigation'
import { authenticateUser } from '@/lib/auth'
import { createSession, destroySession } from '@/lib/session'

export type LoginFormErrors = {
  email?: string
  password?: string
  general?: string
}

export type LoginResult = {
  success: boolean
  errors?: LoginFormErrors
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!email || !email.trim()) {
    return { success: false, errors: { email: 'Email is required' } }
  }
  if (!password) {
    return { success: false, errors: { password: 'Password is required' } }
  }

  const user = await authenticateUser(email, password)
  
  if (!user) {
    return { success: false, errors: { general: 'Invalid email or password' } }
  }

  await createSession(user.id)
  
  redirect('/')
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/login')
}
