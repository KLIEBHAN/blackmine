import type { TimeEntry, ActivityType } from '@/types'

export interface TimeEntryFormData {
  issueId: string
  hours: number
  activityType: ActivityType
  spentOn: Date
  comments: string
}

export interface TimeEntryFormErrors {
  issueId?: string
  hours?: string
  activityType?: string
  spentOn?: string
  comments?: string
}

export function validateTimeEntryForm(data: TimeEntryFormData): TimeEntryFormErrors {
  const errors: TimeEntryFormErrors = {}

  if (!data.issueId) {
    errors.issueId = 'Issue is required'
  }

  if (data.hours === null || data.hours === undefined) {
    errors.hours = 'Hours is required'
  } else if (data.hours <= 0) {
    errors.hours = 'Hours must be greater than 0'
  } else if (data.hours > 24) {
    errors.hours = 'Hours cannot exceed 24 per entry'
  }

  if (!data.activityType) {
    errors.activityType = 'Activity type is required'
  }

  if (!data.spentOn) {
    errors.spentOn = 'Date is required'
  }

  return errors
}

export function createTimeEntryFromForm(
  data: TimeEntryFormData,
  userId: string
): TimeEntry {
  return {
    id: `time-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    issueId: data.issueId,
    userId,
    hours: data.hours,
    activityType: data.activityType,
    spentOn: data.spentOn,
    comments: data.comments,
    createdAt: new Date(),
  }
}
