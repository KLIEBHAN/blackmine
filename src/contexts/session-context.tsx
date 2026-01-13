'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { UserRole } from '@/types'

export type ClientSession = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

type SessionContextType = {
  session: ClientSession | null
  hasRole: (allowedRoles: UserRole[]) => boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isAdminOrManager: boolean
}

const SessionContext = createContext<SessionContextType | null>(null)

type SessionProviderProps = {
  session: ClientSession | null
  children: ReactNode
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  const hasRole = (allowedRoles: UserRole[]) => {
    if (!session) return false
    return allowedRoles.includes(session.role)
  }

  const value: SessionContextType = {
    session,
    hasRole,
    isAuthenticated: !!session,
    isAdmin: hasRole(['admin']),
    isAdminOrManager: hasRole(['admin', 'manager']),
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
