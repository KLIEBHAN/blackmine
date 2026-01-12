'use server'

import { prisma } from '@/lib/db'
import { EMAIL_REGEX } from '@/lib/user-form'
import { revalidatePath } from 'next/cache'
import { handleActionError } from './utils'

export type UserFormData = {
  email: string
  firstName: string
  lastName: string
  role?: string
}

export type UserFormErrors = {
  email?: string
  firstName?: string
  lastName?: string
  general?: string
}

// Get all users
export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

// Get single user by ID
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

// Validate user form
function validateUserForm(data: UserFormData): UserFormErrors {
  const errors: UserFormErrors = {}

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required'
  }
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required'
  }
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Invalid email format'
  }

  return errors
}

// Check if email is already taken
export async function isEmailTaken(email: string, excludeId?: string) {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })
  
  if (!existing) return false
  if (excludeId && existing.id === excludeId) return false
  return true
}

// Create a new user
export async function createUser(data: UserFormData) {
  const errors = validateUserForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  // Check for duplicate email
  const taken = await isEmailTaken(data.email)
  if (taken) {
    return { 
      success: false, 
      errors: { email: 'This email is already in use' } 
    }
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: data.role || 'developer',
      },
    })

    revalidatePath('/admin/users')
    
    return { success: true, user }
  } catch (error) {
    return handleActionError(error, 'create user', true)
  }
}

// Update an existing user
export async function updateUser(id: string, data: Partial<UserFormData>) {
  const updateData: Record<string, unknown> = {}

  if (data.firstName !== undefined) {
    if (!data.firstName || data.firstName.trim().length === 0) {
      return { success: false, errors: { firstName: 'First name is required' } }
    }
    updateData.firstName = data.firstName.trim()
  }
  
  if (data.lastName !== undefined) {
    if (!data.lastName || data.lastName.trim().length === 0) {
      return { success: false, errors: { lastName: 'Last name is required' } }
    }
    updateData.lastName = data.lastName.trim()
  }
  
  if (data.email !== undefined) {
    if (!EMAIL_REGEX.test(data.email)) {
      return { success: false, errors: { email: 'Invalid email format' } }
    }
    const taken = await isEmailTaken(data.email, id)
    if (taken) {
      return { 
        success: false, 
        errors: { email: 'This email is already in use' } 
      }
    }
    updateData.email = data.email.toLowerCase().trim()
  }
  
  if (data.role !== undefined) {
    updateData.role = data.role
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/users')
    
    return { success: true, user }
  } catch (error) {
    return handleActionError(error, 'update user', true)
  }
}

// Delete a user
export async function deleteUser(id: string) {
  try {
    // Check if user has any references that would prevent deletion
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            authoredIssues: true,
            assignedIssues: true,
            timeEntries: true,
            comments: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: 'User not found.' }
    }

    const { authoredIssues, assignedIssues, timeEntries, comments } = user._count
    const totalRefs = authoredIssues + assignedIssues + timeEntries + comments

    if (totalRefs > 0) {
      const parts: string[] = []
      if (authoredIssues > 0) parts.push(`${authoredIssues} authored issue${authoredIssues > 1 ? 's' : ''}`)
      if (assignedIssues > 0) parts.push(`${assignedIssues} assigned issue${assignedIssues > 1 ? 's' : ''}`)
      if (timeEntries > 0) parts.push(`${timeEntries} time entr${timeEntries > 1 ? 'ies' : 'y'}`)
      if (comments > 0) parts.push(`${comments} comment${comments > 1 ? 's' : ''}`)
      
      return {
        success: false,
        error: `Cannot delete user. They have ${parts.join(', ')}. Reassign or remove these first.`,
      }
    }

    await prisma.user.delete({
      where: { id },
    })

    revalidatePath('/admin/users')
    
    return { success: true }
  } catch (error) {
    return handleActionError(error, 'delete user')
  }
}
