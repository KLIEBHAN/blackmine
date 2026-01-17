'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/session'
import { handleActionError } from './utils'
import {
  defaultAppSettings,
  validateAppSettings,
  type AppSettingsFormData,
} from '@/lib/settings'
import {
  allIssuePriorities,
  allIssueTrackers,
  type IssuePriority,
  type IssueTracker,
} from '@/types'

const SETTINGS_ID = 'global'

export async function getAppSettings(): Promise<AppSettingsFormData> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
  })

  if (!settings) {
    await prisma.appSettings.create({
      data: { id: SETTINGS_ID, ...defaultAppSettings },
    })
    return { ...defaultAppSettings }
  }

  const instanceName = settings.instanceName.trim() || defaultAppSettings.instanceName
  const defaultIssueTracker = allIssueTrackers.includes(settings.defaultIssueTracker as IssueTracker)
    ? (settings.defaultIssueTracker as IssueTracker)
    : defaultAppSettings.defaultIssueTracker
  const defaultIssuePriority = allIssuePriorities.includes(settings.defaultIssuePriority as IssuePriority)
    ? (settings.defaultIssuePriority as IssuePriority)
    : defaultAppSettings.defaultIssuePriority

  return {
    instanceName,
    defaultIssueTracker,
    defaultIssuePriority,
  }
}

export async function updateAppSettings(data: AppSettingsFormData) {
  await requireRole(['admin'])

  const errors = validateAppSettings(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  const instanceName = data.instanceName.trim()

  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        instanceName,
        defaultIssueTracker: data.defaultIssueTracker,
        defaultIssuePriority: data.defaultIssuePriority,
      },
      update: {
        instanceName,
        defaultIssueTracker: data.defaultIssueTracker,
        defaultIssuePriority: data.defaultIssuePriority,
      },
    })

    revalidatePath('/', 'layout')
    revalidatePath('/login')
    revalidatePath('/admin')
    revalidatePath('/admin/settings')

    return { success: true, settings }
  } catch (error) {
    return handleActionError(error, 'update settings', true)
  }
}
