import { describe, it, expect } from 'vitest'
import { defaultAppSettings, validateAppSettings } from './settings'
import type { IssuePriority, IssueTracker } from '@/types'

describe('validateAppSettings', () => {
  it('requires a non-empty instance name', () => {
    const errors = validateAppSettings({
      ...defaultAppSettings,
      instanceName: '   ',
    })

    expect(errors.instanceName).toBe('Instance name is required')
  })

  it('limits instance name length', () => {
    const errors = validateAppSettings({
      ...defaultAppSettings,
      instanceName: 'A'.repeat(61),
    })

    expect(errors.instanceName).toBe('Instance name must be 60 characters or less')
  })

  it('validates default tracker and priority values', () => {
    const errors = validateAppSettings({
      ...defaultAppSettings,
      defaultIssueTracker: 'invalid' as IssueTracker,
      defaultIssuePriority: 'invalid' as IssuePriority,
    })

    expect(errors.defaultIssueTracker).toBe('Invalid default tracker')
    expect(errors.defaultIssuePriority).toBe('Invalid default priority')
  })

  it('accepts valid settings', () => {
    const errors = validateAppSettings(defaultAppSettings)
    expect(Object.keys(errors)).toHaveLength(0)
  })
})
