import type { Comment, SortDirection } from '@/types'

type SortField = 'createdAt'

/**
 * Sort comments by field and direction
 */
export function sortComments(
  comments: Comment[],
  field: SortField = 'createdAt',
  direction: SortDirection = 'asc'
): Comment[] {
  return [...comments].sort((a, b) => {
    const aValue = a[field].getTime()
    const bValue = b[field].getTime()
    return direction === 'asc' ? aValue - bValue : bValue - aValue
  })
}

/**
 * Find a comment by ID
 */
export function getCommentById(
  comments: Comment[],
  id: string
): Comment | undefined {
  return comments.find(c => c.id === id)
}

/**
 * Get all comments for an issue, sorted by createdAt ascending
 */
export function getCommentsByIssue(
  comments: Comment[],
  issueId: string
): Comment[] {
  return sortComments(
    comments.filter(c => c.issueId === issueId),
    'createdAt',
    'asc'
  )
}
