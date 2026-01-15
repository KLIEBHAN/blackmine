import { getIssues } from '@/app/actions/issues'
import { getUsers } from '@/app/actions/users'
import { IssuesList } from './issues-list'
import type { IssueStatus } from '@/types'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

// Serialize dates to strings for client component
function serializeIssue(issue: Awaited<ReturnType<typeof getIssues>>[number]) {
  return {
    ...issue,
    dueDate: issue.dueDate?.toISOString() ?? null,
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
}

type Props = {
  searchParams: Promise<{ status?: string; due?: string }>
}

export default async function IssuesPage({ searchParams }: Props) {
  const { status, due } = await searchParams
  const [issues, users] = await Promise.all([getIssues(), getUsers()])
  const serializedIssues = issues.map(serializeIssue)
  const serializedUsers = users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
  }))

  // Parse status param: single value or comma-separated
  const initialStatuses: IssueStatus[] | undefined = status
    ? (status.split(',') as IssueStatus[])
    : undefined

  // Parse due param for date-based filtering
  const initialDueFilter = due === 'this_week' ? 'this_week' : undefined

  return (
    <IssuesList
      issues={serializedIssues}
      totalCount={issues.length}
      users={serializedUsers}
      initialStatuses={initialStatuses}
      initialDueFilter={initialDueFilter}
    />
  )
}
