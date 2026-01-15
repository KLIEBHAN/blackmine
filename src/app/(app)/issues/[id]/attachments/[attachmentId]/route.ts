import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await requireAuth()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id, attachmentId } = await params

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, issueId: id },
  })

  if (!attachment) {
    return new Response('Not found', { status: 404 })
  }

  try {
    await stat(attachment.storagePath)
  } catch {
    return new Response('File missing', { status: 410 })
  }

  const stream = Readable.toWeb(createReadStream(attachment.storagePath)) as unknown as ReadableStream
  const encodedFilename = encodeURIComponent(attachment.filename)

  return new Response(stream, {
    headers: {
      'Content-Type': attachment.contentType,
      'Content-Length': String(attachment.size),
      'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
