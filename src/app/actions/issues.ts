'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import { textileToMarkdown } from '@/lib/textile'
import { handleActionError } from './utils'

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
      attachments: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// Search issues by subject/description (for quick search)
export async function searchIssues(query: string, limit = 10) {
  if (!query || query.trim().length < 2) {
    return []
  }
  
  const searchTerm = query.trim()
  
  return prisma.issue.findMany({
    where: {
      OR: [
        { subject: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ],
    },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      tracker: true,
      project: { select: { name: true, identifier: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
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
export async function createIssue(data: IssueFormData) {
  const session = await requireAuth()
  
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
        descriptionFormat: 'markdown',
        priority: data.priority,
        authorId: session.id,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours || null,
      },
    })

    revalidatePath('/issues')
    revalidatePath(`/projects/${issue.projectId}`)
    
    return { success: true, issue }
  } catch (error) {
    return handleActionError(error, 'create issue', true)
  }
}

// Update an existing issue
export async function updateIssue(id: string, data: Partial<IssueFormData> & { status?: string }) {
  await requireAuth()
  
  const updateData: Record<string, unknown> = {}

  if (data.subject !== undefined) {
    if (!data.subject || data.subject.trim().length === 0) {
      return { success: false, errors: { subject: 'Subject is required' } }
    }
    updateData.subject = data.subject.trim()
  }
  if (data.description !== undefined) {
    updateData.description = data.description.trim()
    updateData.descriptionFormat = 'markdown'
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
    return handleActionError(error, 'update issue', true)
  }
}

export async function convertIssueDescriptionToMarkdown(id: string) {
  await requireAuth()

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { description: true, descriptionFormat: true },
    })

    if (!issue) {
      return { success: false, error: 'Issue not found' }
    }

    if (issue.descriptionFormat === 'markdown') {
      return { success: true, updated: false }
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        description: textileToMarkdown(issue.description),
        descriptionFormat: 'markdown',
      },
      include: { project: true },
    })

    revalidatePath('/issues')
    revalidatePath(`/issues/${id}`)
    revalidatePath(`/projects/${updated.project.identifier}`)

    return { success: true, updated: true }
  } catch (error) {
    return handleActionError(error, 'convert issue description', true)
  }
}

// Delete an issue
export async function deleteIssue(id: string) {
  await requireAuth()
  
  try {
    const issue = await prisma.issue.delete({
      where: { id },
      include: { project: true },
    })

    revalidatePath('/issues')
    revalidatePath(`/projects/${issue.project.identifier}`)

    return { success: true }
  } catch (error) {
    return handleActionError(error, 'delete issue')
  }
}

// Type for bulk update (only fields that can be bulk-edited)
export type BulkUpdateData = {
  status?: string
  priority?: string
  tracker?: string
  assigneeId?: string | null  // null = set to unassigned
  dueDate?: string | null     // null = clear due date
}

// Bulk update multiple issues
export async function bulkUpdateIssues(
  ids: string[],
  data: BulkUpdateData
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  await requireAuth()
  
  if (!ids.length) {
    return { success: false, error: 'No issues selected' }
  }

  // Build update data (only include explicitly set fields)
  const updateData: Record<string, unknown> = {}

  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.priority !== undefined) {
    updateData.priority = data.priority
  }
  if (data.tracker !== undefined) {
    updateData.tracker = data.tracker
  }
  if (data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId || null
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No changes specified' }
  }

  try {
    const result = await prisma.issue.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    revalidatePath('/issues')

    return { success: true, updatedCount: result.count }
  } catch (error) {
    return handleActionError(error, 'bulk update issues')
  }
}
