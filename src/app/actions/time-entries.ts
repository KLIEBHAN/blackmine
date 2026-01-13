'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import { handleActionError } from './utils'

export type TimeEntryFormData = {
  issueId: string
  hours: number
  activityType: string
  spentOn: string
  comments?: string
}

export type TimeEntryFormErrors = {
  issueId?: string
  hours?: string
  activityType?: string
  spentOn?: string
  general?: string
}

// Get all time entries
export async function getTimeEntries() {
  return prisma.timeEntry.findMany({
    include: {
      issue: {
        include: { project: true },
      },
      user: true,
    },
    orderBy: { spentOn: 'desc' },
  })
}

// Get time entries for a specific issue
export async function getTimeEntriesByIssue(issueId: string) {
  return prisma.timeEntry.findMany({
    where: { issueId },
    include: { user: true },
    orderBy: { spentOn: 'desc' },
  })
}

// Get time entries for a specific user
export async function getTimeEntriesByUser(userId: string) {
  return prisma.timeEntry.findMany({
    where: { userId },
    include: {
      issue: {
        include: { project: true },
      },
    },
    orderBy: { spentOn: 'desc' },
  })
}

// Validate time entry form
function validateTimeEntryForm(data: TimeEntryFormData): TimeEntryFormErrors {
  const errors: TimeEntryFormErrors = {}

  if (!data.issueId) {
    errors.issueId = 'Issue is required'
  }
  if (!data.hours || data.hours <= 0) {
    errors.hours = 'Hours must be greater than 0'
  } else if (data.hours > 24) {
    errors.hours = 'Hours cannot exceed 24'
  }
  if (!data.activityType) {
    errors.activityType = 'Activity type is required'
  }
  if (!data.spentOn) {
    errors.spentOn = 'Date is required'
  }

  return errors
}

// Create a new time entry
export async function createTimeEntry(data: TimeEntryFormData) {
  const session = await requireAuth()
  
  const errors = validateTimeEntryForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    const timeEntry = await prisma.timeEntry.create({
      data: {
        issueId: data.issueId,
        userId: session.id,
        hours: data.hours,
        activityType: data.activityType,
        spentOn: new Date(data.spentOn),
        comments: data.comments?.trim() || '',
      },
      include: {
        issue: true,
      },
    })

    revalidatePath('/time')
    revalidatePath(`/issues/${data.issueId}`)
    
    return { success: true, timeEntry }
  } catch (error) {
    return handleActionError(error, 'create time entry', true)
  }
}

// Delete a time entry
export async function deleteTimeEntry(id: string) {
  const session = await requireAuth()
  
  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { userId: true, issueId: true },
  })
  if (!existing) {
    return { success: false, error: 'Time entry not found' }
  }
  if (existing.userId !== session.id && session.role !== 'admin') {
    return { success: false, error: 'You can only delete your own time entries' }
  }
  
  try {
    await prisma.timeEntry.delete({
      where: { id },
    })

    revalidatePath('/time')
    revalidatePath(`/issues/${existing.issueId}`)
    
    return { success: true }
  } catch (error) {
    return handleActionError(error, 'delete time entry')
  }
}
