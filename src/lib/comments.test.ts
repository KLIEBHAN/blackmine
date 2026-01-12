import { describe, it, expect } from 'vitest'
import type { Comment } from '@/types'
import {
  sortComments,
  getCommentById,
  getCommentsByIssue,
} from './comments'

// Test data
const mockComments: Comment[] = [
  {
    id: 'comment-1',
    issueId: 'issue-1',
    authorId: 'user-1',
    content: 'First comment on the issue',
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-10T10:00:00Z'),
  },
  {
    id: 'comment-2',
    issueId: 'issue-1',
    authorId: 'user-2',
    content: 'Second comment with more details',
    createdAt: new Date('2024-01-11T14:30:00Z'),
    updatedAt: new Date('2024-01-11T14:30:00Z'),
  },
  {
    id: 'comment-3',
    issueId: 'issue-2',
    authorId: 'user-1',
    content: 'Comment on different issue',
    createdAt: new Date('2024-01-09T08:00:00Z'),
    updatedAt: new Date('2024-01-12T09:00:00Z'),
  },
]

describe('sortComments', () => {
  it('sorts by createdAt ascending (oldest first)', () => {
    const result = sortComments(mockComments, 'createdAt', 'asc')
    expect(result[0].id).toBe('comment-3')
    expect(result[2].id).toBe('comment-2')
  })

  it('sorts by createdAt descending (newest first)', () => {
    const result = sortComments(mockComments, 'createdAt', 'desc')
    expect(result[0].id).toBe('comment-2')
    expect(result[2].id).toBe('comment-3')
  })

  it('does not mutate original array', () => {
    const original = [...mockComments]
    sortComments(mockComments, 'createdAt', 'desc')
    expect(mockComments).toEqual(original)
  })
})

describe('getCommentById', () => {
  it('returns comment when found', () => {
    const result = getCommentById(mockComments, 'comment-2')
    expect(result).toBeDefined()
    expect(result?.id).toBe('comment-2')
    expect(result?.content).toBe('Second comment with more details')
  })

  it('returns undefined when not found', () => {
    const result = getCommentById(mockComments, 'non-existent')
    expect(result).toBeUndefined()
  })
})

describe('getCommentsByIssue', () => {
  it('returns all comments for a specific issue', () => {
    const result = getCommentsByIssue(mockComments, 'issue-1')
    expect(result).toHaveLength(2)
    expect(result.every((c: Comment) => c.issueId === 'issue-1')).toBe(true)
  })

  it('returns empty array when no comments for issue', () => {
    const result = getCommentsByIssue(mockComments, 'non-existent-issue')
    expect(result).toHaveLength(0)
  })

  it('returns comments sorted by createdAt ascending by default', () => {
    const result = getCommentsByIssue(mockComments, 'issue-1')
    expect(result[0].id).toBe('comment-1')
    expect(result[1].id).toBe('comment-2')
  })
})
