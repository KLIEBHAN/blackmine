import { mkdir, unlink } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { dirname, basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream } from 'node:stream/web'

export const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024 * 1024

const DEFAULT_UPLOADS_DIR = join(process.cwd(), 'data', 'uploads')

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR ?? DEFAULT_UPLOADS_DIR
}

export function sanitizeFilename(name: string): string {
  const base = basename(name || 'file')
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned || 'file'
}

export async function ensureUploadsDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export function buildStoragePath(issueId: string, filename: string): string {
  const safeName = sanitizeFilename(filename)
  const ext = extname(safeName)
  const id = randomUUID()
  const storedName = ext ? `${id}${ext}` : id
  return join(getUploadsDir(), issueId, storedName)
}

export async function saveAttachmentFile(file: File, issueId: string): Promise<string> {
  const storagePath = buildStoragePath(issueId, file.name)
  await ensureUploadsDir(dirname(storagePath))

  const webStream = file.stream() as unknown as ReadableStream<Uint8Array>
  const readable = Readable.fromWeb(webStream)
  const writable = createWriteStream(storagePath)
  await pipeline(readable, writable)

  return storagePath
}

export async function removeAttachmentFile(storagePath: string): Promise<void> {
  try {
    await unlink(storagePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}
