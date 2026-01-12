'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type ProjectFormData = {
  name: string
  identifier: string
  description?: string
  status?: string
}

export type ProjectFormErrors = {
  name?: string
  identifier?: string
  general?: string
}

// Get all projects
export async function getProjects() {
  return prisma.project.findMany({
    include: {
      _count: {
        select: { issues: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// Get single project by identifier
export async function getProjectByIdentifier(identifier: string) {
  return prisma.project.findUnique({
    where: { identifier },
    include: {
      issues: {
        include: {
          author: true,
          assignee: true,
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
}

// Get project by ID
export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
  })
}

// Validate project form
function validateProjectForm(data: ProjectFormData): ProjectFormErrors {
  const errors: ProjectFormErrors = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required'
  } else if (data.name.length > 100) {
    errors.name = 'Name must be 100 characters or less'
  }

  if (!data.identifier || data.identifier.trim().length === 0) {
    errors.identifier = 'Identifier is required'
  } else if (!/^[a-z][a-z0-9-]*$/.test(data.identifier)) {
    errors.identifier = 'Identifier must start with a letter and contain only lowercase letters, numbers, and hyphens'
  } else if (data.identifier.length > 50) {
    errors.identifier = 'Identifier must be 50 characters or less'
  }

  return errors
}

// Check if identifier is already taken
export async function isIdentifierTaken(identifier: string, excludeId?: string) {
  const existing = await prisma.project.findUnique({
    where: { identifier },
    select: { id: true },
  })
  
  if (!existing) return false
  if (excludeId && existing.id === excludeId) return false
  return true
}

// Create a new project
export async function createProject(data: ProjectFormData) {
  const errors = validateProjectForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  // Check for duplicate identifier
  const taken = await isIdentifierTaken(data.identifier)
  if (taken) {
    return { 
      success: false, 
      errors: { identifier: 'This identifier is already in use' } 
    }
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: data.name.trim(),
        identifier: data.identifier.toLowerCase(),
        description: data.description?.trim() || '',
        status: data.status || 'active',
      },
    })

    revalidatePath('/projects')
    
    return { success: true, project }
  } catch (error) {
    console.error('Failed to create project:', error)
    return { 
      success: false, 
      errors: { general: 'Failed to create project. Please try again.' } 
    }
  }
}

// Update an existing project
export async function updateProject(id: string, data: Partial<ProjectFormData>) {
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, errors: { name: 'Name is required' } }
    }
    updateData.name = data.name.trim()
  }
  
  if (data.identifier !== undefined) {
    if (!/^[a-z][a-z0-9-]*$/.test(data.identifier)) {
      return { 
        success: false, 
        errors: { identifier: 'Invalid identifier format' } 
      }
    }
    const taken = await isIdentifierTaken(data.identifier, id)
    if (taken) {
      return { 
        success: false, 
        errors: { identifier: 'This identifier is already in use' } 
      }
    }
    updateData.identifier = data.identifier.toLowerCase()
  }
  
  if (data.description !== undefined) {
    updateData.description = data.description.trim()
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/projects')
    revalidatePath(`/projects/${project.identifier}`)
    
    return { success: true, project }
  } catch (error) {
    console.error('Failed to update project:', error)
    return { 
      success: false, 
      errors: { general: 'Failed to update project. Please try again.' } 
    }
  }
}

// Delete a project
export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    })

    revalidatePath('/projects')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return { 
      success: false, 
      error: 'Failed to delete project. Please try again.' 
    }
  }
}
