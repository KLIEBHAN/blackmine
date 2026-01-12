import type { User, UserRole } from '@/types'

export interface UserFormData {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface UserFormErrors {
  email?: string
  firstName?: string
  lastName?: string
  role?: string
}

/** Simple email format validation regex */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateUserForm(
  data: UserFormData,
  existingEmails: string[] = [],
  excludeEmail?: string
): UserFormErrors {
  const errors: UserFormErrors = {}

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Invalid email format'
  } else {
    // Check for duplicates
    const normalizedEmail = data.email.toLowerCase()
    const normalizedExclude = excludeEmail?.toLowerCase()
    const isDuplicate = existingEmails.some(
      (e) => e.toLowerCase() === normalizedEmail && e.toLowerCase() !== normalizedExclude
    )
    if (isDuplicate) {
      errors.email = 'Email already exists'
    }
  }

  // First name validation
  if (!data.firstName) {
    errors.firstName = 'First name is required'
  } else if (data.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  }

  // Last name validation
  if (!data.lastName) {
    errors.lastName = 'Last name is required'
  } else if (data.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  }

  // Role validation
  if (!data.role) {
    errors.role = 'Role is required'
  }

  return errors
}

export function createUserFromForm(data: UserFormData): User {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    email: data.email.toLowerCase().trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: data.role,
    createdAt: new Date(),
  }
}

export function updateUserFromForm(user: User, data: UserFormData): User {
  return {
    ...user,
    email: data.email.toLowerCase().trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: data.role,
  }
}
