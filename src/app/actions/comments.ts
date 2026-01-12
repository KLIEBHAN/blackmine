'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
  authorId: string,
  data: CommentFormData
) {
  const errors = validateCommentForm(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        issueId,
        authorId,
        content: data.content.trim(),
      },
      include: {
        author: true,
      },
    })

    revalidatePath(`/issues/${issueId}`)

    return { success: true, comment }
  } catch (error) {
    console.error('Failed to create comment:', error)
    return {
      success: false,
      errors: { general: 'Failed to add comment. Please try again.' },
    }
  }
}

// Update an existing comment
export async function updateComment(id: string, data: CommentFormData) {
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
    console.error('Failed to update comment:', error)
    return {
      success: false,
      errors: { general: 'Failed to update comment. Please try again.' },
    }
  }
}

// Delete a comment
export async function deleteComment(id: string) {
  try {
    const comment = await prisma.comment.delete({
      where: { id },
    })

    revalidatePath(`/issues/${comment.issueId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return {
      success: false,
      error: 'Failed to delete comment. Please try again.',
    }
  }
}
