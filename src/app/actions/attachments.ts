'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  removeAttachmentFile,
  saveAttachmentFile,
  sanitizeFilename,
} from '@/lib/attachments'
import { handleActionError } from './utils'

export type AttachmentFormErrors = {
  file?: string
  general?: string
}

type PendingAttachment = {
  file: File
  storagePath: string
}

async function ensureIssueExists(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true },
  })

  if (!issue) {
    return { success: false, error: 'Issue not found.' }
  }

  return { success: true }
}

function validateFile(file: File): AttachmentFormErrors | null {
  if (!file.name) {
    return { file: 'File name is missing.' }
  }

  if (file.size <= 0) {
    return { file: 'File is empty.' }
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return { file: 'File exceeds the 100 MB upload limit.' }
  }

  return null
}

export async function uploadAttachment(issueId: string, formData: FormData) {
  const session = await requireAuth()

  const files = formData.getAll('file').filter((item): item is File => item instanceof File)
  if (files.length === 0) {
    return { success: false, errors: { file: 'Please choose a file to upload.' } }
  }

  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      return { success: false, errors: error }
    }
  }

  const issueCheck = await ensureIssueExists(issueId)
  if (!issueCheck.success) {
    return { success: false, errors: { general: issueCheck.error } }
  }

  const pending: PendingAttachment[] = []

  try {
    for (const file of files) {
      const storagePath = await saveAttachmentFile(file, issueId)
      pending.push({ file, storagePath })
    }

    const created = await prisma.$transaction(
      pending.map(({ file, storagePath }) =>
        prisma.attachment.create({
          data: {
            issueId,
            authorId: session.id,
            filename: sanitizeFilename(file.name),
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            storagePath,
          },
          include: { author: true },
        })
      )
    )

    revalidatePath(`/issues/${issueId}`)

    return { success: true, attachments: created }
  } catch (error) {
    await Promise.all(pending.map((entry) => removeAttachmentFile(entry.storagePath)))
    return handleActionError(error, 'upload attachment', true)
  }
}

export async function deleteAttachment(attachmentId: string) {
  const session = await requireAuth()

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, authorId: true, issueId: true, storagePath: true },
  })

  if (!attachment) {
    return { success: false, error: 'Attachment not found.' }
  }

  // Verify ownership or admin
  if (attachment.authorId !== session.id && session.role !== 'admin') {
    return { success: false, error: 'You can only delete your own attachments.' }
  }

  const issueCheck = await ensureIssueExists(attachment.issueId)
  if (!issueCheck.success) {
    return { success: false, error: issueCheck.error }
  }

  try {
    await prisma.attachment.delete({ where: { id: attachmentId } })
    await removeAttachmentFile(attachment.storagePath)

    revalidatePath(`/issues/${attachment.issueId}`)

    return { success: true }
  } catch (error) {
    return handleActionError(error, 'delete attachment', true)
  }
}
