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

export async function uploadAttachment(issueId: string, formData: FormData) {
  const session = await requireAuth()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, errors: { file: 'Please choose a file to upload.' } }
  }

  if (!file.name) {
    return { success: false, errors: { file: 'File name is missing.' } }
  }

  if (file.size <= 0) {
    return { success: false, errors: { file: 'File is empty.' } }
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      success: false,
      errors: { file: 'File exceeds the 100 MB upload limit.' },
    }
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true },
  })

  if (!issue) {
    return { success: false, errors: { general: 'Issue not found.' } }
  }

  try {
    const storagePath = await saveAttachmentFile(file, issueId)

    const attachment = await prisma.attachment.create({
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

    revalidatePath(`/issues/${issueId}`)

    return { success: true, attachment }
  } catch (error) {
    return handleActionError(error, 'upload attachment', true)
  }
}

export async function deleteAttachment(attachmentId: string) {
  await requireAuth()

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { issue: true },
  })

  if (!attachment) {
    return { success: false, error: 'Attachment not found.' }
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
