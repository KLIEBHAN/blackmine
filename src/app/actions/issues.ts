'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type IssueFormData = {
  projectId: string
  tracker: string
  subject: string
  description?: string
  priority: string
  assigneeId?: string | null
  dueDate?: string | null
  estimatedHours?: number | null
}

export type IssueFormErrors = {
  projectId?: string
  tracker?: string
  subject?: string
  priority?: string
  general?: string
}

// Get all issues with relations
export async function getIssues() {
  return prisma.issue.findMany({
    include: {
      project: true,
      author: true,
      assignee: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// Get single issue by ID
export async function getIssueById(id: string) {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      project: true,
      author: true,
      assignee: true,
      timeEntries: {
        include: { user: true },
        orderBy: { spentOn: 'desc' },
      },
    },
  })
}

// Get issues for a specific project
export async function getIssuesByProject(projectId: string) {
  return prisma.issue.findMany({
    where: { projectId },
    include: {
      author: true,
      assignee: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// Validate issue form
function validateIssueForm(data: IssueFormData): IssueFormErrors {
  const errors: IssueFormErrors = {}

  if (!data.projectId) {
    errors.projectId = 'Project is required'
  }
  if (!data.tracker) {
    errors.tracker = 'Tracker is required'
  }
  if (!data.subject || data.subject.trim().length === 0) {
    errors.subject = 'Subject is required'
  } else if (data.subject.length > 255) {
    errors.subject = 'Subject must be 255 characters or less'
  }
  if (!data.priority) {
    errors.priority = 'Priority is required'
  }

  return errors
}

// Create a new issue
export async function createIssue(data: IssueFormData, authorId: string) {
  const errors = validateIssueForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    const issue = await prisma.issue.create({
      data: {
        projectId: data.projectId,
        tracker: data.tracker,
        subject: data.subject.trim(),
        description: data.description?.trim() || '',
        priority: data.priority,
        authorId,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours || null,
      },
    })

    revalidatePath('/issues')
    revalidatePath(`/projects/${issue.projectId}`)
    
    return { success: true, issue }
  } catch (error) {
    console.error('Failed to create issue:', error)
    return { 
      success: false, 
      errors: { general: 'Failed to create issue. Please try again.' } 
    }
  }
}

// Update an existing issue
export async function updateIssue(id: string, data: Partial<IssueFormData> & { status?: string }) {
  const updateData: Record<string, unknown> = {}

  if (data.subject !== undefined) {
    if (!data.subject || data.subject.trim().length === 0) {
      return { success: false, errors: { subject: 'Subject is required' } }
    }
    updateData.subject = data.subject.trim()
  }
  if (data.description !== undefined) {
    updateData.description = data.description.trim()
  }
  if (data.tracker !== undefined) {
    updateData.tracker = data.tracker
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.priority !== undefined) {
    updateData.priority = data.priority
  }
  if (data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId || null
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }
  if (data.estimatedHours !== undefined) {
    updateData.estimatedHours = data.estimatedHours
  }

  try {
    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: { project: true },
    })

    revalidatePath('/issues')
    revalidatePath(`/issues/${id}`)
    revalidatePath(`/projects/${issue.project.identifier}`)
    
    return { success: true, issue }
  } catch (error) {
    console.error('Failed to update issue:', error)
    return { 
      success: false, 
      errors: { general: 'Failed to update issue. Please try again.' } 
    }
  }
}

// Delete an issue
export async function deleteIssue(id: string) {
  try {
    const issue = await prisma.issue.delete({
      where: { id },
      include: { project: true },
    })

    revalidatePath('/issues')
    revalidatePath(`/projects/${issue.project.identifier}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete issue:', error)
    return { 
      success: false, 
      error: 'Failed to delete issue. Please try again.' 
    }
  }
}
