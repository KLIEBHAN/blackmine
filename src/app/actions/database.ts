'use server'

import { prisma } from '@/lib/db'

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
  console.log('[DB Import] Starting import...')
  console.log('[DB Import] Data counts:', {
    users: data.data.users.length,
    projects: data.data.projects.length,
    issues: data.data.issues.length,
    timeEntries: data.data.timeEntries.length,
    comments: data.data.comments.length,
  })

  try {
    if (data.version !== 1) {
      console.error('[DB Import] Unsupported version:', data.version)
      return { success: false, error: 'Unsupported export version' }
    }

    console.log('[DB Import] Deleting existing data...')
    await prisma.comment.deleteMany()
    await prisma.timeEntry.deleteMany()
    await prisma.issue.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    console.log('[DB Import] Deletion complete')

    console.log('[DB Import] Creating users...')
    for (const user of data.data.users) {
      await prisma.user.create({
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
    console.log(`[DB Import] Created ${data.data.users.length} users`)

    console.log('[DB Import] Creating projects...')
    for (const project of data.data.projects) {
      await prisma.project.create({
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
    console.log(`[DB Import] Created ${data.data.projects.length} projects`)

    console.log('[DB Import] Creating issues...')
    for (const issue of data.data.issues) {
      await prisma.issue.create({
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
    console.log(`[DB Import] Created ${data.data.issues.length} issues`)

    console.log('[DB Import] Creating time entries...')
    for (const entry of data.data.timeEntries) {
      await prisma.timeEntry.create({
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
    console.log(`[DB Import] Created ${data.data.timeEntries.length} time entries`)

    console.log('[DB Import] Creating comments...')
    for (const comment of data.data.comments) {
      await prisma.comment.create({
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
    console.log(`[DB Import] Created ${data.data.comments.length} comments`)

    const finalCounts = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      issues: await prisma.issue.count(),
      timeEntries: await prisma.timeEntry.count(),
      comments: await prisma.comment.count(),
    }

    console.log('[DB Import] Final counts:', finalCounts)
    console.log('[DB Import] Import completed successfully')

    return {
      success: true,
      counts: finalCounts,
    }
  } catch (error) {
    console.error('[DB Import] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
