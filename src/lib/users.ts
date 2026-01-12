import type { User, UserRole, SortDirection } from '@/types'

export interface UserFilters {
  role?: UserRole
  search?: string
}

export type UserSortField = 'firstName' | 'lastName' | 'email' | 'role' | 'createdAt'
export type { SortDirection } from '@/types'

export function filterUsers(users: User[], filters: UserFilters): User[] {
  return users.filter(user => {
    // Role filter
    if (filters.role && user.role !== filters.role) {
      return false
    }

    // Search filter (firstName, lastName, email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesFirstName = user.firstName.toLowerCase().includes(searchLower)
      const matchesLastName = user.lastName.toLowerCase().includes(searchLower)
      const matchesEmail = user.email.toLowerCase().includes(searchLower)
      if (!matchesFirstName && !matchesLastName && !matchesEmail) {
        return false
      }
    }

    return true
  })
}

export function sortUsers(
  users: User[],
  field: UserSortField,
  direction: SortDirection
): User[] {
  const sorted = [...users].sort((a, b) => {
    let comparison = 0

    switch (field) {
      case 'firstName':
        comparison = a.firstName.localeCompare(b.firstName)
        break
      case 'lastName':
        comparison = a.lastName.localeCompare(b.lastName)
        break
      case 'email':
        comparison = a.email.localeCompare(b.email)
        break
      case 'role':
        comparison = a.role.localeCompare(b.role)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}

export function getUserById(users: User[], id: string): User | undefined {
  return users.find(user => user.id === id)
}

export function deleteUser(users: User[], id: string): User[] {
  return users.filter(user => user.id !== id)
}

export function getUsersByRole(users: User[]): Map<UserRole, User[]> {
  const grouped = new Map<UserRole, User[]>()

  for (const user of users) {
    const existing = grouped.get(user.role) || []
    grouped.set(user.role, [...existing, user])
  }

  return grouped
}
