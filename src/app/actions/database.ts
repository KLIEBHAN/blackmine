'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'

function log(...args: unknown[]) {
  console.log('[DB]', ...args)
}

function logError(...args: unknown[]) {
  console.error('[DB ERROR]', ...args)
}

export interface DatabaseExport {
  version: number
  exportedAt: string
  data: {
    users: Array<{
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
      createdAt: string
    }>
    projects: Array<{
      id: string
      name: string
      identifier: string
      description: string
      status: string
      createdAt: string
      updatedAt: string
    }>
    issues: Array<{
      id: string
      tracker: string
      subject: string
      description: string
      status: string
      priority: string
      dueDate: string | null
      estimatedHours: number | null
      createdAt: string
      updatedAt: string
      projectId: string
      authorId: string
      assigneeId: string | null
    }>
    timeEntries: Array<{
      id: string
      hours: number
      comments: string
      activityType: string
      spentOn: string
      createdAt: string
      issueId: string
      userId: string
    }>
    comments: Array<{
      id: string
      content: string
      createdAt: string
      updatedAt: string
      issueId: string
      authorId: string
    }>
  }
}

function validateExportData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' }
  }

  const d = data as Record<string, unknown>

  if (d.version !== 1) {
    return { valid: false, error: `Unsupported version: ${d.version}` }
  }

  if (!d.data || typeof d.data !== 'object') {
    return { valid: false, error: 'Missing data object' }
  }

  const dataObj = d.data as Record<string, unknown>
  const requiredArrays = ['users', 'projects', 'issues', 'timeEntries', 'comments']

  for (const key of requiredArrays) {
    if (!Array.isArray(dataObj[key])) {
      return { valid: false, error: `Missing or invalid ${key} array` }
    }
  }

  const users = dataObj.users as Array<Record<string, unknown>>
  for (const user of users) {
    if (!user.id || !user.email || !user.firstName || !user.lastName) {
      return { valid: false, error: 'Invalid user data: missing required fields' }
    }
  }

  const projects = dataObj.projects as Array<Record<string, unknown>>
  for (const project of projects) {
    if (!project.id || !project.name || !project.identifier) {
      return { valid: false, error: 'Invalid project data: missing required fields' }
    }
  }

  const issues = dataObj.issues as Array<Record<string, unknown>>
  const userIds = new Set(users.map((u) => u.id))
  const projectIds = new Set(projects.map((p) => p.id))

  for (const issue of issues) {
    if (!issue.id || !issue.subject || !issue.projectId || !issue.authorId) {
      return { valid: false, error: 'Invalid issue data: missing required fields' }
    }
    if (!projectIds.has(issue.projectId)) {
      return { valid: false, error: `Issue references non-existent project: ${issue.projectId}` }
    }
    if (!userIds.has(issue.authorId)) {
      return { valid: false, error: `Issue references non-existent author: ${issue.authorId}` }
    }
    if (issue.assigneeId && !userIds.has(issue.assigneeId)) {
      return { valid: false, error: `Issue references non-existent assignee: ${issue.assigneeId}` }
    }
  }

  const issueIds = new Set(issues.map((i) => i.id))

  const timeEntries = dataObj.timeEntries as Array<Record<string, unknown>>
  for (const entry of timeEntries) {
    if (!entry.id || !entry.issueId || !entry.userId) {
      return { valid: false, error: 'Invalid time entry: missing required fields' }
    }
    if (!issueIds.has(entry.issueId)) {
      return { valid: false, error: `Time entry references non-existent issue: ${entry.issueId}` }
    }
    if (!userIds.has(entry.userId)) {
      return { valid: false, error: `Time entry references non-existent user: ${entry.userId}` }
    }
  }

  const comments = dataObj.comments as Array<Record<string, unknown>>
  for (const comment of comments) {
    if (!comment.id || !comment.issueId || !comment.authorId) {
      return { valid: false, error: 'Invalid comment: missing required fields' }
    }
    if (!issueIds.has(comment.issueId)) {
      return { valid: false, error: `Comment references non-existent issue: ${comment.issueId}` }
    }
    if (!userIds.has(comment.authorId)) {
      return { valid: false, error: `Comment references non-existent author: ${comment.authorId}` }
    }
  }

  return { valid: true }
}

export async function exportDatabase(): Promise<DatabaseExport> {
  const [users, projects, issues, timeEntries, comments] = await Promise.all([
    prisma.user.findMany(),
    prisma.project.findMany(),
    prisma.issue.findMany(),
    prisma.timeEntry.findMany(),
    prisma.comment.findMany(),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
      projects: projects.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      issues: issues.map((i) => ({
        ...i,
        dueDate: i.dueDate?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      timeEntries: timeEntries.map((t) => ({
        ...t,
        spentOn: t.spentOn.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    },
  }
}

export async function importDatabase(
  data: DatabaseExport
): Promise<{ success: boolean; error?: string; counts?: Record<string, number> }> {
  await requireRole(['admin'])
  
  log('Starting import validation...')

  const validation = validateExportData(data)
  if (!validation.valid) {
    logError('Validation failed:', validation.error)
    return { success: false, error: validation.error }
  }

  log('Validation passed. Data counts:', {
    users: data.data.users.length,
    projects: data.data.projects.length,
    issues: data.data.issues.length,
    timeEntries: data.data.timeEntries.length,
    comments: data.data.comments.length,
  })

  try {
    log('Starting atomic import transaction...')

    await prisma.$transaction(async (tx) => {
      log('Deleting existing data...')
      await tx.comment.deleteMany()
      await tx.timeEntry.deleteMany()
      await tx.issue.deleteMany()
      await tx.project.deleteMany()
      await tx.user.deleteMany()

      log('Inserting users...')
      for (const user of data.data.users) {
        await tx.user.create({
          data: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: new Date(user.createdAt),
          },
        })
      }

      log('Inserting projects...')
      for (const project of data.data.projects) {
        await tx.project.create({
          data: {
            id: project.id,
            name: project.name,
            identifier: project.identifier,
            description: project.description,
            status: project.status,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          },
        })
      }

      log('Inserting issues...')
      for (const issue of data.data.issues) {
        await tx.issue.create({
          data: {
            id: issue.id,
            tracker: issue.tracker,
            subject: issue.subject,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
            estimatedHours: issue.estimatedHours,
            createdAt: new Date(issue.createdAt),
            updatedAt: new Date(issue.updatedAt),
            projectId: issue.projectId,
            authorId: issue.authorId,
            assigneeId: issue.assigneeId,
          },
        })
      }

      log('Inserting time entries...')
      for (const entry of data.data.timeEntries) {
        await tx.timeEntry.create({
          data: {
            id: entry.id,
            hours: entry.hours,
            comments: entry.comments,
            activityType: entry.activityType,
            spentOn: new Date(entry.spentOn),
            createdAt: new Date(entry.createdAt),
            issueId: entry.issueId,
            userId: entry.userId,
          },
        })
      }

      log('Inserting comments...')
      for (const comment of data.data.comments) {
        await tx.comment.create({
          data: {
            id: comment.id,
            content: comment.content,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
            issueId: comment.issueId,
            authorId: comment.authorId,
          },
        })
      }
    }, { timeout: 60000 })

    const finalCounts = await getDatabaseStats()
    log('Import completed. Final counts:', finalCounts)

    // Revalidate all affected pages
    log('Revalidating cached pages...')
    revalidatePath('/', 'layout')
    revalidatePath('/admin/users')
    revalidatePath('/admin/database')
    revalidatePath('/projects')
    revalidatePath('/issues')
    revalidatePath('/time')

    return { success: true, counts: finalCounts }
  } catch (error) {
    logError('Transaction failed (rolled back):', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed - all changes rolled back',
    }
  }
}

export async function getDatabaseStats(): Promise<Record<string, number>> {
  const [users, projects, issues, timeEntries, comments] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.issue.count(),
    prisma.timeEntry.count(),
    prisma.comment.count(),
  ])

  return { users, projects, issues, timeEntries, comments }
}
