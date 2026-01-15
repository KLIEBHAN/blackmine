import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await requireAuth()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id, attachmentId } = await params
  const url = new URL(request.url)
  const preview = url.searchParams.get('preview') === '1'

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

  const nodeStream = createReadStream(attachment.storagePath)
  // Node.js stream/web.ReadableStream is runtime-compatible with Web ReadableStream
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream
  const encoded = encodeURIComponent(attachment.filename)
  const isPdf = attachment.contentType === 'application/pdf' || attachment.filename.toLowerCase().endsWith('.pdf')
  const disposition = preview && isPdf
    ? `inline; filename="${encoded}"; filename*=UTF-8''${encoded}`
    : `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`

  return new Response(webStream, {
    headers: {
      'Content-Type': attachment.contentType,
      'Content-Length': String(attachment.size),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
