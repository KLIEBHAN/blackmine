import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { containsTextileMarkup } from '../src/lib/textile'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const issues = await prisma.issue.findMany({
    select: { id: true, description: true, descriptionFormat: true },
  })

  const textileIssueIds = issues
    .filter((issue) => issue.descriptionFormat !== 'textile')
    .filter((issue) => issue.description && containsTextileMarkup(issue.description))
    .map((issue) => issue.id)

  if (textileIssueIds.length > 0) {
    await prisma.issue.updateMany({
      where: { id: { in: textileIssueIds } },
      data: { descriptionFormat: 'textile' },
    })
  }

  const comments = await prisma.comment.findMany({
    select: { id: true, content: true, contentFormat: true },
  })

  const textileCommentIds = comments
    .filter((comment) => comment.contentFormat !== 'textile')
    .filter((comment) => comment.content && containsTextileMarkup(comment.content))
    .map((comment) => comment.id)

  if (textileCommentIds.length > 0) {
    await prisma.comment.updateMany({
      where: { id: { in: textileCommentIds } },
      data: { contentFormat: 'textile' },
    })
  }

  console.log(`Updated ${textileIssueIds.length} issues and ${textileCommentIds.length} comments.`)
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
