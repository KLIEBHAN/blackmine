import { allIssuePriorities, allIssueTrackers, type IssuePriority, type IssueTracker } from '@/types'

export type AppSettingsFormData = {
  instanceName: string
  defaultIssueTracker: IssueTracker
  defaultIssuePriority: IssuePriority
}

export type AppSettingsFormErrors = {
  instanceName?: string
  defaultIssueTracker?: string
  defaultIssuePriority?: string
  general?: string
}

export const defaultAppSettings: AppSettingsFormData = {
  instanceName: 'Blackmine',
  defaultIssueTracker: 'bug',
  defaultIssuePriority: 'normal',
}

const MAX_INSTANCE_NAME_LENGTH = 60

export function validateAppSettings(data: AppSettingsFormData): AppSettingsFormErrors {
  const errors: AppSettingsFormErrors = {}
  const instanceName = data.instanceName.trim()

  if (!instanceName) {
    errors.instanceName = 'Instance name is required'
  } else if (instanceName.length > MAX_INSTANCE_NAME_LENGTH) {
    errors.instanceName = `Instance name must be ${MAX_INSTANCE_NAME_LENGTH} characters or less`
  }

  if (!allIssueTrackers.includes(data.defaultIssueTracker)) {
    errors.defaultIssueTracker = 'Invalid default tracker'
  }

  if (!allIssuePriorities.includes(data.defaultIssuePriority)) {
    errors.defaultIssuePriority = 'Invalid default priority'
  }

  return errors
}
