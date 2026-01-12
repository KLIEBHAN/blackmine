import { notFound } from 'next/navigation'
import { getIssueById } from '@/app/actions/issues'
import { getCommentsByIssue } from '@/app/actions/comments'
import { IssueDetail, type SerializedIssue } from './issue-detail'
import { type SerializedComment } from './comments'

interface IssueDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params
  const [issue, comments] = await Promise.all([
    getIssueById(id),
    getCommentsByIssue(id),
  ])

  if (!issue) {
    notFound()
  }

  // Serialize dates for client component
  const serializedIssue: SerializedIssue = {
    id: issue.id,
    subject: issue.subject,
    description: issue.description,
    tracker: issue.tracker,
    status: issue.status,
    priority: issue.priority,
    dueDate: issue.dueDate?.toISOString() ?? null,
    estimatedHours: issue.estimatedHours,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    project: {
      id: issue.project.id,
      name: issue.project.name,
      identifier: issue.project.identifier,
    },
    author: {
      id: issue.author.id,
      firstName: issue.author.firstName,
      lastName: issue.author.lastName,
    },
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          firstName: issue.assignee.firstName,
          lastName: issue.assignee.lastName,
        }
      : null,
  }

  const serializedComments: SerializedComment[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author: {
      id: c.author.id,
      firstName: c.author.firstName,
      lastName: c.author.lastName,
    },
  }))

  // For now, use the first user as current user (in real app, get from auth)
  const currentUserId = issue.author.id

  return (
    <IssueDetail
      issue={serializedIssue}
      comments={serializedComments}
      currentUserId={currentUserId}
    />
  )
}
