import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateIssueStatus, updateIssue, bulkUpdateIssues } from './issues'

// Mock the database
vi.mock('@/lib/db', () => ({
  prisma: {
    issue: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// Mock the session
vi.mock('@/lib/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', role: 'admin' }),
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from '@/lib/db'

describe('updateIssueStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully updates issue status', async () => {
    const mockIssue = {
      id: 'issue-1',
      status: 'in_progress',
      project: { identifier: 'test-project' },
    }

    vi.mocked(prisma.issue.update).mockResolvedValue(mockIssue as never)

    const result = await updateIssueStatus('issue-1', 'in_progress')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.issue.status).toBe('in_progress')
    }
    expect(prisma.issue.update).toHaveBeenCalledWith({
      where: { id: 'issue-1' },
      data: { status: 'in_progress' },
      include: { project: true },
    })
  })

  it('rejects invalid status values', async () => {
    const result = await updateIssueStatus('issue-1', 'invalid_status')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid status: invalid_status')
    }
    expect(prisma.issue.update).not.toHaveBeenCalled()
  })

  it('returns error when issue does not exist', async () => {
    const prismaError = new Error('Record not found') as Error & { code: string }
    prismaError.code = 'P2025'

    vi.mocked(prisma.issue.update).mockRejectedValue(prismaError)

    const result = await updateIssueStatus('non-existent-id', 'closed')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Issue not found')
    }
  })

  it.each([
    'new',
    'in_progress',
    'resolved',
    'closed',
    'rejected',
  ])('accepts valid status: %s', async (status) => {
    const mockIssue = {
      id: 'issue-1',
      status,
      project: { identifier: 'test-project' },
    }

    vi.mocked(prisma.issue.update).mockResolvedValue(mockIssue as never)

    const result = await updateIssueStatus('issue-1', status)

    expect(result.success).toBe(true)
  })
})

describe('updateIssue with status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully updates issue status via updateIssue', async () => {
    const mockIssue = {
      id: 'issue-1',
      status: 'resolved',
      project: { identifier: 'test-project' },
    }

    vi.mocked(prisma.issue.update).mockResolvedValue(mockIssue as never)

    const result = await updateIssue('issue-1', { status: 'resolved' })

    expect(result.success).toBe(true)
    expect(prisma.issue.update).toHaveBeenCalledWith({
      where: { id: 'issue-1' },
      data: { status: 'resolved' },
      include: { project: true },
    })
  })

  it('rejects invalid status in updateIssue', async () => {
    const result = await updateIssue('issue-1', { status: 'invalid_status' })

    expect(result.success).toBe(false)
    if (!result.success && 'errors' in result) {
      expect(result.errors?.general).toBe('Invalid status: invalid_status')
    }
    expect(prisma.issue.update).not.toHaveBeenCalled()
  })

  it.each([
    'new',
    'in_progress',
    'resolved',
    'closed',
    'rejected',
  ])('accepts valid status via updateIssue: %s', async (status) => {
    const mockIssue = {
      id: 'issue-1',
      status,
      project: { identifier: 'test-project' },
    }

    vi.mocked(prisma.issue.update).mockResolvedValue(mockIssue as never)

    const result = await updateIssue('issue-1', { status })

    expect(result.success).toBe(true)
  })
})

describe('bulkUpdateIssues status validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully bulk updates with valid status', async () => {
    vi.mocked(prisma.issue.updateMany).mockResolvedValue({ count: 3 })

    const result = await bulkUpdateIssues(['issue-1', 'issue-2', 'issue-3'], {
      status: 'closed',
    })

    expect(result.success).toBe(true)
    expect(result.updatedCount).toBe(3)
    expect(prisma.issue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['issue-1', 'issue-2', 'issue-3'] } },
      data: { status: 'closed' },
    })
  })

  it('rejects invalid status in bulk update', async () => {
    const result = await bulkUpdateIssues(['issue-1', 'issue-2'], {
      status: 'invalid_status',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid status: invalid_status')
    expect(prisma.issue.updateMany).not.toHaveBeenCalled()
  })

  it.each([
    'new',
    'in_progress',
    'resolved',
    'closed',
    'rejected',
  ])('accepts valid status in bulk update: %s', async (status) => {
    vi.mocked(prisma.issue.updateMany).mockResolvedValue({ count: 2 })

    const result = await bulkUpdateIssues(['issue-1', 'issue-2'], { status })

    expect(result.success).toBe(true)
    expect(result.updatedCount).toBe(2)
  })
})
