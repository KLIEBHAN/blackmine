'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import { handleActionError } from './utils'

export type CommentFormData = {
  content: string
}

export type CommentFormErrors = {
  content?: string
  general?: string
}

// Get all comments for an issue
export async function getCommentsByIssue(issueId: string) {
  return prisma.comment.findMany({
    where: { issueId },
    include: {
      author: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

// Get single comment by ID
export async function getCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      author: true,
      issue: true,
    },
  })
}

// Validate comment form
function validateCommentForm(data: CommentFormData): CommentFormErrors {
  const errors: CommentFormErrors = {}

  if (!data.content || data.content.trim().length === 0) {
    errors.content = 'Comment cannot be empty'
  } else if (data.content.length > 10000) {
    errors.content = 'Comment must be 10000 characters or less'
  }

  return errors
}

// Create a new comment
export async function createComment(
  issueId: string,
  data: CommentFormData
) {
  const session = await requireAuth()
  
  const errors = validateCommentForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        issueId,
        authorId: session.id,
        content: data.content.trim(),
      },
      include: {
        author: true,
      },
    })

    revalidatePath(`/issues/${issueId}`)

    return { success: true, comment }
  } catch (error) {
    return handleActionError(error, 'add comment', true)
  }
}

// Update an existing comment
export async function updateComment(id: string, data: CommentFormData) {
  const session = await requireAuth()
  
  // Verify ownership
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!existing || existing.authorId !== session.id) {
    return { success: false, errors: { general: 'You can only edit your own comments' } }
  }
  
  const errors = validateCommentForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content: data.content.trim(),
      },
      include: {
        issue: true,
      },
    })

    revalidatePath(`/issues/${comment.issueId}`)

    return { success: true, comment }
  } catch (error) {
    return handleActionError(error, 'update comment', true)
  }
}

// Delete a comment
export async function deleteComment(id: string) {
  const session = await requireAuth()
  
  // Verify ownership or admin
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, issueId: true },
  })
  if (!existing) {
    return { success: false, error: 'Comment not found' }
  }
  if (existing.authorId !== session.id && session.role !== 'admin') {
    return { success: false, error: 'You can only delete your own comments' }
  }
  
  try {
    await prisma.comment.delete({
      where: { id },
    })

    revalidatePath(`/issues/${existing.issueId}`)

    return { success: true }
  } catch (error) {
    return handleActionError(error, 'delete comment')
  }
}
