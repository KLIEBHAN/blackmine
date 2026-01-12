import { describe, it, expect } from 'vitest'
import type { User } from '@/types'
import {
  filterUsers,
  sortUsers,
  getUserById,
  deleteUser,
  getUsersByRole,
} from './users'

const createTestUsers = (): User[] => [
  {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'developer',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-3',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'manager',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'user-4',
    email: 'bob.wilson@example.com',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'developer',
    createdAt: new Date('2024-02-15'),
  },
]

describe('filterUsers', () => {
  it('returns all users when no filters', () => {
    const users = createTestUsers()
    const result = filterUsers(users, {})
    expect(result).toHaveLength(4)
  })

  it('filters by role', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { role: 'developer' })
    expect(result).toHaveLength(2)
    expect(result.every(u => u.role === 'developer')).toBe(true)
  })

  it('filters by search on firstName', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { search: 'John' })
    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('John')
  })

  it('filters by search on lastName', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { search: 'smith' })
    expect(result).toHaveLength(1)
    expect(result[0].lastName).toBe('Smith')
  })

  it('filters by search on email', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { search: 'bob.wilson' })
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('bob.wilson@example.com')
  })

  it('combines role and search filters', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { role: 'developer', search: 'john' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('user-2')
  })

  it('returns empty array when no matches', () => {
    const users = createTestUsers()
    const result = filterUsers(users, { search: 'nonexistent' })
    expect(result).toHaveLength(0)
  })
})

describe('sortUsers', () => {
  it('sorts by firstName ascending', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'firstName', 'asc')
    expect(result[0].firstName).toBe('Admin')
    expect(result[3].firstName).toBe('John')
  })

  it('sorts by firstName descending', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'firstName', 'desc')
    expect(result[0].firstName).toBe('John')
    expect(result[3].firstName).toBe('Admin')
  })

  it('sorts by lastName', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'lastName', 'asc')
    expect(result[0].lastName).toBe('Doe')
    expect(result[3].lastName).toBe('Wilson')
  })

  it('sorts by email', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'email', 'asc')
    expect(result[0].email).toBe('admin@example.com')
  })

  it('sorts by createdAt', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'createdAt', 'desc')
    expect(result[0].id).toBe('user-4') // newest
    expect(result[3].id).toBe('user-1') // oldest
  })

  it('sorts by role', () => {
    const users = createTestUsers()
    const result = sortUsers(users, 'role', 'asc')
    expect(result[0].role).toBe('admin')
  })
})

describe('getUserById', () => {
  it('returns user when found', () => {
    const users = createTestUsers()
    const result = getUserById(users, 'user-2')
    expect(result).toBeDefined()
    expect(result?.firstName).toBe('John')
  })

  it('returns undefined when not found', () => {
    const users = createTestUsers()
    const result = getUserById(users, 'nonexistent')
    expect(result).toBeUndefined()
  })
})

describe('deleteUser', () => {
  it('removes user from array', () => {
    const users = createTestUsers()
    const result = deleteUser(users, 'user-2')
    expect(result).toHaveLength(3)
    expect(result.find(u => u.id === 'user-2')).toBeUndefined()
  })

  it('returns same array if user not found', () => {
    const users = createTestUsers()
    const result = deleteUser(users, 'nonexistent')
    expect(result).toHaveLength(4)
  })

  it('does not mutate original array', () => {
    const users = createTestUsers()
    deleteUser(users, 'user-2')
    expect(users).toHaveLength(4)
  })
})

describe('getUsersByRole', () => {
  it('groups users by role', () => {
    const users = createTestUsers()
    const result = getUsersByRole(users)
    expect(result.get('admin')).toHaveLength(1)
    expect(result.get('developer')).toHaveLength(2)
    expect(result.get('manager')).toHaveLength(1)
  })

  it('returns empty map for empty input', () => {
    const result = getUsersByRole([])
    expect(result.size).toBe(0)
  })
})
